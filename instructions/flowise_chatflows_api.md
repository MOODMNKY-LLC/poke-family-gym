Below is a more concise, consistent, and organized version of the Flowise Chatflows API documentation. It provides clear endpoint details, request/response formats, and maintains the same core information.

---

# Flowise Chatflows API Documentation

## Overview
The Flowise Chatflows API allows you to list, create, retrieve, update, and delete chatflows. All requests require Bearer token authentication.

## Authentication
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <JWT>`

Include the Bearer token in the `Authorization` header for **all** requests.

---

## Endpoints

### 1. List All Chatflows
- **Endpoint**: `GET /chatflows`
- **Description**: Retrieve a list of all chatflows.
- **Authorization**: Required

#### Response (200 OK)
An array of chatflow objects:
```json
[
  {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "name": "MyChatFlow",
    "flowData": "{}",
    "deployed": false,
    "isPublic": false,
    "apikeyid": "text",
    "chatbotConfig": "{}",
    "apiConfig": "{}",
    "analytic": "{}",
    "speechToText": "{}",
    "category": "category1;category2",
    "type": "CHATFLOW",
    "createdDate": "2024-08-24T14:15:22Z",
    "updatedDate": "2024-08-24T14:15:22Z"
  }
]
```

---

### 2. Create a New Chatflow
- **Endpoint**: `POST /chatflows`
- **Description**: Create a new chatflow with the given configuration.
- **Authorization**: Required

#### Request Body
```json
{
  "name": "MyChatFlow",
  "flowData": "{}",
  "deployed": false,
  "isPublic": false,
  "apikeyid": "text",
  "chatbotConfig": "{}",
  "apiConfig": "{}",
  "analytic": "{}",
  "speechToText": "{}",
  "category": "category1;category2",
  "type": "CHATFLOW"
}
```

#### Response (201 Created)
```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "MyChatFlow",
  "flowData": "{}",
  "deployed": false,
  "isPublic": false,
  "apikeyid": "text",
  "chatbotConfig": "{}",
  "apiConfig": "{}",
  "analytic": "{}",
  "speechToText": "{}",
  "category": "category1;category2",
  "type": "CHATFLOW",
  "createdDate": "2024-08-24T14:15:22Z",
  "updatedDate": "2024-08-24T14:15:22Z"
}
```

---

### 3. Get Chatflow by ID
- **Endpoint**: `GET /chatflows/{id}`
- **Description**: Retrieve details of a specific chatflow by its ID.
- **Authorization**: Required

#### Path Parameter
- `id` (string) – The ID of the chatflow.

#### Response (200 OK)
```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "MyChatFlow",
  "flowData": "{}",
  "deployed": false,
  "isPublic": false,
  "apikeyid": "text",
  "chatbotConfig": "{}",
  "apiConfig": "{}",
  "analytic": "{}",
  "speechToText": "{}",
  "category": "category1;category2",
  "type": "CHATFLOW",
  "createdDate": "2024-08-24T14:15:22Z",
  "updatedDate": "2024-08-24T14:15:22Z"
}
```

---

### 4. Update Chatflow
- **Endpoint**: `PUT /chatflows/{id}`
- **Description**: Update the configuration of an existing chatflow.
- **Authorization**: Required

#### Path Parameter
- `id` (string) – The ID of the chatflow.

#### Request Body
```json
{
  "name": "UpdatedChatFlow",
  "flowData": "{}",
  "deployed": true,
  "isPublic": true,
  "apikeyid": "text",
  "chatbotConfig": "{}",
  "apiConfig": "{}",
  "analytic": "{}",
  "speechToText": "{}",
  "category": "category3;category4",
  "type": "CHATFLOW"
}
```

#### Response (200 OK)
```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "UpdatedChatFlow",
  "flowData": "{}",
  "deployed": true,
  "isPublic": true,
  "apikeyid": "text",
  "chatbotConfig": "{}",
  "apiConfig": "{}",
  "analytic": "{}",
  "speechToText": "{}",
  "category": "category3;category4",
  "type": "CHATFLOW",
  "createdDate": "2024-08-24T14:15:22Z",
  "updatedDate": "2024-08-24T14:20:00Z"
}
```

---

### 5. Delete a Chatflow
- **Endpoint**: `DELETE /chatflows/{id}`
- **Description**: Delete a specific chatflow by its ID.
- **Authorization**: Required

#### Path Parameter
- `id` (string) – The ID of the chatflow.

#### Response (200 OK)
A successful deletion returns `200 OK` with no response body.

---

### 6. Get Chatflow by API Key
- **Endpoint**: `GET /chatflows/apikey/{apikey}`
- **Description**: Retrieve a chatflow associated with a specific API key.
- **Authorization**: Required

#### Path Parameter
- `apikey` (string) – The API key associated with the chatflow.

#### Response (200 OK)
```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "MyChatFlow",
  "flowData": "{}",
  "deployed": false,
  "isPublic": false,
  "apikeyid": "text",
  "chatbotConfig": "{}",
  "apiConfig": "{}",
  "analytic": "{}",
  "speechToText": "{}",
  "category": "category1;category2",
  "type": "CHATFLOW",
  "createdDate": "2024-08-24T14:15:22Z",
  "updatedDate": "2024-08-24T14:15:22Z"
}
```

---

## Common Fields
- **`id`**: Unique identifier of the chatflow  
- **`name`**: Name of the chatflow  
- **`flowData`**: Configuration details in JSON format  
- **`deployed`**: Deployment status (`true` or `false`)  
- **`isPublic`**: Visibility status (`true` or `false`)  
- **`apikeyid`**: Associated API key  
- **`category`**: Category tags for the chatflow (e.g., `"category1;category2"`)  
- **`type`**: Chatflow type (`CHATFLOW` or `MULTIAGENT`)  
- **`createdDate`**: Timestamp of creation  
- **`updatedDate`**: Timestamp of the last update  

---

## Example Usage

### JavaScript (Fetch API)

#### 1. List All Chatflows
```javascript
const response = await fetch('/chatflows', {
  method: 'GET',
  headers: {
    "Authorization": "Bearer <JWT>"
  }
});
const data = await response.json();
console.log(data);
```

#### 2. Create a New Chatflow
```javascript
const response = await fetch('/chatflows', {
  method: 'POST',
  headers: {
    "Authorization": "Bearer <JWT>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "name": "MyChatFlow",
    "flowData": "{}",
    "deployed": false,
    "isPublic": false
  })
});
const data = await response.json();
console.log(data);
```

---

**Note**: Always ensure your requests include a valid `Authorization` header with a Bearer token.  
