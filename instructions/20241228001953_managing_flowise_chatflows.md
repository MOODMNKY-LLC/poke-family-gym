# Managing Flowise Chatflows

This document outlines how to manage Flowise chatflows in the PokéFamily Gym application.

## Environment Setup

Ensure these environment variables are properly configured:

```env
# Important: Include /api/v1 in the base URL
NEXT_PUBLIC_FLOWISE_API_URL=https://poke-gym-flowise.moodmnky.com/api/v1
NEXT_PUBLIC_FLOWISE_API_KEY=SxwT562HAWnYb7gIFK1gkvHqVn2-5NFgIXUrX5sZC7w
NEXT_PUBLIC_FLOWISE_CHATFLOW_ID=2087e73e-9a20-4113-b975-b113627fc64d
```

## API URL Structure

The Flowise API client is designed to work with the following URL structure:

1. **Base URL** (from environment): 
   ```
   https://poke-gym-flowise.moodmnky.com/api/v1
   ```
   - Must include `/api/v1` in the base URL
   - No trailing slash
   - Used by both chatflows and document store APIs

2. **Endpoint Paths** (in API client):
   ```typescript
   // Correct - Chatflows
   static async getChatFlows(): Promise<ChatFlowListResponse> {
     return this.request('/chatflows')  // Will become /api/v1/chatflows
   }

   // Correct - Document Store
   static async getDocuments(): Promise<Document[]> {
     return this.request('/documentstore')  // Will become /api/v1/documentstore
   }

   // Incorrect - don't include /api/v1 in endpoints
   static async getChatFlows(): Promise<ChatFlowListResponse> {
     return this.request('/api/v1/chatflows')  // Would result in /api/v1/api/v1/chatflows
   }
   ```

3. **Request Construction**:
   ```typescript
   private static async request<T>(endpoint: string, options: RequestInit = {}) {
     const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
     const url = `${FLOWISE_API_URL}${normalizedEndpoint}`
     // ...
   }
   ```

## API Methods

### Chatflows API

```typescript
// List all chatflows
GET /chatflows
static async getChatFlows(): Promise<ChatFlowListResponse>

// Get a specific chatflow
GET /chatflows/{id}
static async getChatFlow(id: string): Promise<ChatFlowResponse>

// Create a new chatflow
POST /chatflows
static async createChatflow(data: Partial<ChatFlow>): Promise<ChatFlowResponse>

// Update a chatflow
PUT /chatflows/{id}
static async updateChatflow(id: string, data: Partial<ChatFlow>): Promise<ChatFlowResponse>

// Delete a chatflow
DELETE /chatflows/{id}
static async deleteChatflow(id: string): Promise<ChatFlowDeleteResponse>

// Validate a chatflow
POST /chatflows/validate
static async validateChatflow(data: Partial<ChatFlow>): Promise<ChatFlowResponse>

// Deploy a chatflow
POST /chatflows/{id}/deploy
static async deployChatflow(id: string): Promise<ChatFlowResponse>

// Undeploy a chatflow
POST /chatflows/{id}/undeploy
static async undeployChatflow(id: string): Promise<ChatFlowResponse>

// Get chatflow configuration
GET /chatflows/{id}/config
static async getChatflowConfig(id: string): Promise<ChatFlowConfig>

// Update chatflow configuration
PUT /chatflows/{id}/config
static async updateChatflowConfig(
  id: string, 
  config: Partial<ChatFlowConfig>
): Promise<ChatFlowConfig>
```

### Document Store API

```typescript
// Upload documents
POST /documentstore/upload
static async uploadDocuments(files: File[], config: ProcessingConfig): Promise<Document[]>

// List all documents
GET /documentstore
static async getDocuments(): Promise<Document[]>

// Delete a document
DELETE /documentstore/{id}
static async deleteDocument(id: string): Promise<void>

// Get document status
GET /documentstore/status/{id}
static async getDocumentStatus(id: string): Promise<{ status: string }>
```

## Response Handling

The API client includes comprehensive response handling:

1. **Content Type Verification**:
   ```typescript
   const contentType = response.headers.get('content-type')
   if (contentType?.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
     throw new FlowiseAPIError(
       'Invalid API response: Server returned HTML instead of JSON',
       'INVALID_RESPONSE_TYPE',
       { url, contentType, htmlPreview: text.substring(0, 500) }
     )
   }
   ```

2. **JSON Parsing**:
   ```typescript
   try {
     data = text ? JSON.parse(text) : null
   } catch (e) {
     throw new FlowiseAPIError(
       'Invalid JSON response from server',
       'INVALID_JSON',
       { url, status: response.status, responseText: text.substring(0, 500) }
     )
   }
   ```

3. **List Response Normalization**:
   ```typescript
   // For list responses, wrap in expected format if not already wrapped
   if (Array.isArray(data) && endpoint.includes('/chatflows')) {
     return {
       chatflows: data,
       total: data.length,
       page: 1,
       pageSize: data.length
     } as T
   }
   ```

## Error Types

The API client throws `FlowiseAPIError` with these common codes:

1. `INVALID_RESPONSE_TYPE`: Server returned HTML instead of JSON
2. `INVALID_JSON`: Response couldn't be parsed as JSON
3. `CONNECTION_ERROR`: Network or server connectivity issues
4. `API_ERROR`: General API errors (with details)

## Debugging Tips

1. **Enable Debug Logging**:
   The API client logs detailed request/response information:
   ```typescript
   console.debug('API Request:', {
     url,
     method: options.method || 'GET',
     headers: { /* redacted */ }
   })

   console.debug('API Response:', {
     status: response.status,
     statusText: response.statusText,
     headers: Object.fromEntries(response.headers.entries())
   })
   ```

2. **Check Network Tab**:
   - Verify the complete URL includes `/api/v1` only once
   - Confirm proper headers are sent
   - Check response content type is `application/json`

3. **Common Issues**:
   - Double `/api/v1` in URL (check environment variable)
   - Missing or invalid API key
   - HTML responses (server misconfiguration)
   - Network connectivity problems
   - FormData content type handling for file uploads

## Related Files

- `app/lib/flowise/api.ts`: Main API client implementation
- `app/lib/flowise/types.ts`: TypeScript types for chatflows and documents
- `app/protected/components/chatflows-list.tsx`: Chatflows UI component
- `app/protected/components/document-list.tsx`: Document list UI component
- `app/protected/components/poke-dexter-control.tsx`: Control panel component
- `scripts/list-chatflows.ts`: Utility script for listing chatflows
- `instructions/_PokeDexter Chatflow.json`: Example chatflow configuration 

## Socket Connection Setup

The socket connection should be configured with the base URL only, as `/api/v1` is already included:

```typescript
const socket = socketIOClient(process.env.NEXT_PUBLIC_FLOWISE_API_URL || '', {
  transports: ['websocket', 'polling'],
  path: '/socket.io',  // Do NOT include /api/v1 here
  reconnection: true,
  reconnectionAttempts: maxReconnectAttempts,
  reconnectionDelay: reconnectDelay
})
```

## Chatflow Switching

When switching between family members, their assigned chatflows are handled as follows:

1. **Member Selection**:
   ```typescript
   // When a member is selected, check for their assigned chatflow
   if (selectedMember?.chatflow_id) {
     const assignedChatflow = chatflows.find(cf => cf.id === selectedMember.chatflow_id)
     if (assignedChatflow?.id) {
       // Validate and switch to the assigned chatflow
       const isValid = await validateChatflow(assignedChatflow.id)
       if (isValid) {
         setCurrentChatflowId(assignedChatflow.id)
       }
     }
   }
   ```

2. **Fallback Logic**:
   ```typescript
   // If no valid chatflow is assigned, use the default
   const defaultId = getDefaultChatflowId(chatflows)
   setCurrentChatflowId(defaultId)
   ```

3. **Member Data Query**:
   ```typescript
   // Include chatflow_id when fetching family members
   const { data: members } = await supabase
     .from('family_members')
     .select(`
       id,
       family_id,
       display_name,
       role_id,
       chatflow_id
     `)
   ```

## Important Notes

1. The `NEXT_PUBLIC_FLOWISE_API_URL` environment variable should already include `/api/v1`
2. Socket connection path should be just `/socket.io`
3. Always validate chatflows before switching to ensure they are accessible
4. Include proper error handling and fallback to default chatflow when needed
5. Ensure the family members query includes the `chatflow_id` field 