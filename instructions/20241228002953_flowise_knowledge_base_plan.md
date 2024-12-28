# Flowise Knowledge Base Implementation Plan

## Overview
This document outlines the plan for implementing a comprehensive Knowledge Base management system within the PokéDexter Control Panel, integrating with Flowise's Document Store and Vector Upsert APIs.

## API URL Structure

The Document Store API follows the same URL structure as the Chatflows API:

1. **Base URL** (from environment): 
   ```
   https://poke-gym-flowise.moodmnky.com/api/v1
   ```
   - Must include `/api/v1` in the base URL
   - No trailing slash
   - Shared by both chatflows and document store APIs

2. **Endpoint Paths**:
   ```typescript
   // All paths are relative to base URL (/api/v1)
   /documentstore           // List documents
   /documentstore/upload    // Upload documents
   /documentstore/{id}      // Delete document
   /documentstore/status/{id} // Get document status
   ```

## 1. Document Management

### UI Components
- Document list table with columns:
  - Name
  - Type (PDF, Text, JSON, etc.)
  - Size
  - Upload Date
  - Status (Indexed/Processing)
  - Actions (Delete, Reindex)
- Upload dialog with:
  - File input (multi-file support)
  - Document type selection
  - Processing options
- Progress indicators for upload/indexing
- Filtering and search capabilities

### API Integration
- Document Upload:
  ```typescript
  POST /documentstore/upload
  Content-Type: multipart/form-data
  Authorization: Bearer ${FLOWISE_API_KEY}
  
  // Request body:
  FormData {
    files: File[],
    config: JSON.stringify(ProcessingConfig)
  }
  ```
- Document Retrieval:
  ```typescript
  GET /documentstore
  Accept: application/json
  Authorization: Bearer ${FLOWISE_API_KEY}
  ```
- Document Deletion:
  ```typescript
  DELETE /documentstore/{documentId}
  Authorization: Bearer ${FLOWISE_API_KEY}
  ```
- Status Check:
  ```typescript
  GET /documentstore/status/{documentId}
  Accept: application/json
  Authorization: Bearer ${FLOWISE_API_KEY}
  ```

### Error Handling
The Document Store API uses the same error handling as the Chatflows API:

1. **HTML Response Detection**:
   ```typescript
   if (contentType?.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
     throw new FlowiseAPIError(
       'Invalid API response: Server returned HTML instead of JSON',
       'INVALID_RESPONSE_TYPE',
       { url, contentType, htmlPreview: text }
     )
   }
   ```

2. **FormData Handling**:
   ```typescript
   const isFormData = options.body instanceof FormData
   const headers = {
     'Accept': 'application/json',
     'Authorization': `Bearer ${FLOWISE_API_KEY}`,
     ...(!isFormData && { 'Content-Type': 'application/json' })
   }
   ```

3. **Error Types**:
   - `INVALID_RESPONSE_TYPE`: Server returned HTML instead of JSON
   - `INVALID_JSON`: Response couldn't be parsed as JSON
   - `CONNECTION_ERROR`: Network or server connectivity issues
   - `API_ERROR`: General API errors

## 2. Vector Store Management

### UI Components
- Vector store configuration panel:
  - Store type selection (Pinecone, Supabase, etc.)
  - Connection settings
  - Index management
- Vector operations:
  - Upsert controls
  - Query testing
  - Namespace management

### API Integration
- Vector Upsert:
  ```typescript
  POST /api/v1/vector/upsert
  ```
- Vector Query:
  ```typescript
  POST /api/v1/vector/query
  ```

## 3. Document Processing

### Features
- Automatic text extraction
- Metadata generation
- Chunking configuration:
  - Chunk size
  - Overlap
  - Splitting strategy
- Processing queue management

### API Integration
- Process Status:
  ```typescript
  GET /api/v1/documentstore/status/{documentId}
  ```
- Processing Configuration:
  ```typescript
  POST /api/v1/documentstore/config
  ```

## 4. Search and Retrieval

### UI Components
- Search interface:
  - Full-text search
  - Semantic search
  - Filters (type, date, status)
- Results display:
  - Relevance scores
  - Content previews
  - Source highlighting

### API Integration
- Search Documents:
  ```typescript
  POST /api/v1/documentstore/search
  ```
- Retrieve Content:
  ```typescript
  GET /api/v1/documentstore/content/{documentId}
  ```

## 5. Integration with Chatflows

### Features
- Document-chatflow association
- Knowledge base selection in chatflow configuration
- Context window management
- Source attribution in responses

### Implementation
- Update chatflow schema to include knowledge base configuration
- Add document selection in chatflow builder
- Implement context injection in chat responses

## 6. Security and Access Control

### Features
- Document-level permissions
- Access logging
- Content validation
- Version control

### Implementation
- Integrate with existing auth system
- Implement document ownership
- Add audit logging
- Set up content validation rules

## 7. Performance Considerations

### Optimizations
- Chunked uploads for large files
- Background processing
- Caching strategy
- Rate limiting
- Progress tracking

### Monitoring
- Upload/processing metrics
- Storage usage
- API performance
- Error tracking

## Implementation Phases

### Phase 1: Core Document Management
1. Basic document upload/delete
2. Document list view
3. Status tracking
4. Simple search

### Phase 2: Vector Store Integration
1. Vector store configuration
2. Upsert functionality
3. Query testing
4. Namespace management

### Phase 3: Advanced Features
1. Batch operations
2. Advanced search
3. Processing configuration
4. Analytics integration

### Phase 4: Optimization
1. Performance tuning
2. UI/UX improvements
3. Error handling
4. Documentation

## API Types

```typescript
interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  status: 'processing' | 'indexed' | 'failed'
  metadata: {
    chunks: number
    vectors: number
    [key: string]: any
  }
}

interface VectorConfig {
  type: 'pinecone' | 'supabase' | 'other'
  config: {
    apiKey?: string
    environment?: string
    index?: string
    [key: string]: any
  }
}

interface ProcessingConfig {
  chunkSize: number
  chunkOverlap: number
  splitStrategy: 'token' | 'sentence' | 'paragraph'
  embedModel: string
  [key: string]: any
}
```

## Next Steps
1. Implement basic document upload/list UI
2. Set up API integration
3. Add document processing
4. Implement vector store management
5. Add search functionality
6. Integrate with chatflows
7. Optimize and refine 