import axios from 'axios'
import type { Document, VectorConfig, ProcessingConfig } from './types'

// Custom error class for Flowise API errors
export class FlowiseAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'FlowiseAPIError'
  }
}

export const FlowiseAPI = {
  async getChatFlows() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/chatflows`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch chatflows:', error)
      throw new FlowiseAPIError(
        'Failed to fetch chatflows',
        'API_ERROR',
        error
      )
    }
  },

  async getChatflow(id: string) {
    if (!id) throw new FlowiseAPIError('Chatflow ID is required', 'MISSING_ID')
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/chatflows/${id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch chatflow:', error)
      throw new FlowiseAPIError(
        'Failed to fetch chatflow',
        'API_ERROR',
        error
      )
    }
  },

  async updateChatflow(id: string, data: any) {
    if (!id) throw new FlowiseAPIError('Chatflow ID is required', 'MISSING_ID')
    if (!data) throw new FlowiseAPIError('Chatflow data is required', 'MISSING_DATA')
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/chatflows/${id}`,
        data,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to update chatflow:', error)
      throw new FlowiseAPIError(
        'Failed to update chatflow',
        'API_ERROR',
        error
      )
    }
  },

  async deleteChatflow(id: string) {
    if (!id) throw new FlowiseAPIError('Chatflow ID is required', 'MISSING_ID')
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/chatflows/${id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to delete chatflow:', error)
      throw new FlowiseAPIError(
        'Failed to delete chatflow',
        'API_ERROR',
        error
      )
    }
  }
}

export const DocumentStoreAPI = {
  // Upload documents
  async uploadDocuments(files: File[], config?: ProcessingConfig) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    if (config) {
      formData.append('config', JSON.stringify(config))
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/documentstore/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  },

  // Get document by ID
  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/documentstore/${documentId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get document: ${response.statusText}`)
    }

    return response.json()
  },

  // List all documents
  async listDocuments(): Promise<Document[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/documentstore`)
    
    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.statusText}`)
    }

    return response.json()
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/documentstore/${documentId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`)
    }
  },

  // Get document processing status
  async getDocumentStatus(documentId: string): Promise<{ status: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/documentstore/status/${documentId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`)
    }

    return response.json()
  },

  // Search documents
  async searchDocuments(query: string, filters?: Record<string, any>) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/documentstore/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, ...filters })
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const VectorAPI = {
  // Upsert vectors
  async upsertVectors(data: any, config: VectorConfig) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/vector/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data, config })
    })
    
    if (!response.ok) {
      throw new Error(`Vector upsert failed: ${response.statusText}`)
    }

    return response.json()
  },

  // Query vectors
  async queryVectors(query: string, config: VectorConfig) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/vector/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, config })
    })
    
    if (!response.ok) {
      throw new Error(`Vector query failed: ${response.statusText}`)
    }

    return response.json()
  }
} 