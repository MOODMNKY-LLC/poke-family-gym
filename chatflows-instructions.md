```markdown
# Chatflows API Documentation

This document provides an overview of the Chatflows API, including endpoints for listing, creating, retrieving, updating, and deleting chatflows.

---

## List all chatflows

**Description**  
Retrieve a list of all chatflows.

**Endpoint**  
```
GET /chatflows
```

**Authorization**  
- **bearerAuth** (JWT token)

**Response**
- **200** – Successful operation

**Response Body** (`application/json`)
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

### Sample Request (JavaScript)
```js
const response = await fetch('/chatflows', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    },
});
const data = await response.json();
```

---

## Create a new chatflow

**Description**  
Create a new chatflow with the provided details.

**Endpoint**  
```
POST /chatflows
```

**Authorization**  
- **bearerAuth** (JWT token)

**Request Body** (`application/json`)
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

**Response**
- **200** – Chatflow created successfully

**Response Body** (`application/json`)
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

### Sample Request (JavaScript)
```js
const response = await fetch('/chatflows', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({}),
});
const data = await response.json();
```

---

## Get chatflow by ID

**Description**  
Retrieve a specific chatflow by ID.

**Endpoint**  
```
GET /chatflows/{id}
```

**Authorization**  
- **bearerAuth** (JWT token)

**Path Parameters**  
- **id** (*string*) – Chatflow ID

**Response**
- **200** – Successful operation

**Response Body** (`application/json`)
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

### Sample Request (JavaScript)
```js
const response = await fetch('/chatflows/{id}', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    },
});
const data = await response.json();
```

---

## Update chatflow details

**Description**  
Update the details of an existing chatflow.

**Endpoint**  
```
PUT /chatflows/{id}
```

**Authorization**  
- **bearerAuth** (JWT token)

**Path Parameters**  
- **id** (*string*) – Chatflow ID

**Request Body** (`application/json`)
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

**Response**
- **200** – Chatflow updated successfully

**Response Body** (`application/json`)
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

### Sample Request (JavaScript)
```js
const response = await fetch('/chatflows/{id}', {
    method: 'PUT',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({}),
});
const data = await response.json();
```

---

## Delete a chatflow

**Description**  
Delete a chatflow by ID.

**Endpoint**  
```
DELETE /chatflows/{id}
```

**Authorization**  
- **bearerAuth** (JWT token)

**Path Parameters**  
- **id** (*string*) – Chatflow ID

**Response**
- **200** – Chatflow deleted successfully

### Sample Request (JavaScript)
```js
const response = await fetch('/chatflows/{id}', {
    method: 'DELETE',
    headers: {
      "Authorization": "Bearer JWT"
    },
});
const data = await response.json();
```

---

## Get chatflow by API key

**Description**  
Retrieve a chatflow using an API key.

**Endpoint**  
```
GET /chatflows/apikey/{apikey}
```

**Authorization**  
- **bearerAuth** (JWT token)

**Path Parameters**  
- **apikey** (*string*) – API key associated with the chatflow

**Response**
- **200** – Successful operation

**Response Body** (`application/json`)
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

### Sample Request (JavaScript)
```js
const response = await fetch('/chatflows/apikey/{apikey}', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    },
});
const data = await response.json();
```
```