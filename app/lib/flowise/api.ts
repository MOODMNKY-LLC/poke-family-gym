import axios, { AxiosRequestConfig } from 'axios'
import type { Document, VectorConfig, ProcessingConfig } from './types'
import type { ChatFlow } from '@/lib/supabase/chatflows'

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

interface ChatFlowListResponse {
  chatflows: ChatFlow[]
  total: number
  page: number
  pageSize: number
}

// Update to match API response exactly (no wrapper)
type ChatFlowResponse = ChatFlow

interface ChatFlowDeleteResponse {
  message: string
}

interface CreateChatflowRequest {
  name: string
  flowData: string
  deployed: boolean
  isPublic: boolean
  apikeyid?: string
  chatbotConfig?: string
  apiConfig?: string
  analytic?: string
  speechToText?: string
  category?: string
  type: 'CHATFLOW' | 'MULTIAGENT'
}

export class FlowiseAPI {
  private static async request<T>(endpoint: string, options: Partial<AxiosRequestConfig> = {}) {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}${normalizedEndpoint}`
    
    try {
      console.log('Making API request:', {
        url,
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`,
          ...options.headers
        },
        data: options.data
      })

      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`,
          ...options.headers
        },
        ...options
      })

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      })

      // For list responses, wrap in expected format if not already wrapped
      if (Array.isArray(response.data) && endpoint.includes('/chatflows')) {
        return {
          chatflows: response.data,
          total: response.data.length,
          page: 1,
          pageSize: response.data.length
        } as T
      }

      return response.data as T
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
      } else {
        console.error('Non-Axios Error:', error)
      }
      throw new FlowiseAPIError(
        `Failed to ${options.method || 'GET'} ${endpoint}`,
        'API_ERROR',
        error
      )
    }
  }

  static async getChatFlows(): Promise<ChatFlowListResponse> {
    return this.request<ChatFlowListResponse>('/chatflows')
  }

  static async getChatflow(id: string): Promise<ChatFlowResponse> {
    if (!id) throw new FlowiseAPIError('Chatflow ID is required', 'MISSING_ID')
    return this.request<ChatFlowResponse>(`/chatflows/${id}`)
  }

  static async createChatflow(data: Partial<ChatFlow>): Promise<ChatFlowResponse> {
    // Transform the data to match the API spec exactly
    const requestData: CreateChatflowRequest = {
      name: data.name || '',
      flowData: typeof data.flowData === 'string' ? data.flowData : JSON.stringify(data.flowData || {}),
      deployed: data.deployed || false,
      isPublic: data.isPublic || false,
      type: 'CHATFLOW', // Always use CHATFLOW as per docs
      chatbotConfig: typeof data.chatbotConfig === 'string' ? data.chatbotConfig : JSON.stringify(data.chatbotConfig || {}),
      apikeyid: data.apikeyid || undefined,
      apiConfig: data.apiConfig || undefined,
      analytic: data.analytic || undefined,
      speechToText: data.speechToText ? 'true' : 'false',
      category: Array.isArray(data.category) 
        ? data.category.join(';') 
        : (data.category || undefined)
    }

    console.log('Making createChatflow API call to:', `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/chatflows`)
    console.log('Request headers:', {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_FLOWISE_API_KEY?.substring(0, 5) + '...'
    })
    console.log('Request body:', JSON.stringify(requestData, null, 2))
    
    return this.request<ChatFlowResponse>('/chatflows', {
      method: 'POST',
      data: requestData
    })
  }

  static async updateChatflow(id: string, data: Partial<ChatFlow>): Promise<ChatFlowResponse> {
    if (!id) throw new FlowiseAPIError('Chatflow ID is required', 'MISSING_ID')
    return this.request<ChatFlowResponse>(`/chatflows/${id}`, {
      method: 'PUT',
      data
    })
  }

  static async deleteChatflow(id: string): Promise<ChatFlowDeleteResponse> {
    if (!id) throw new FlowiseAPIError('Chatflow ID is required', 'MISSING_ID')
    return this.request<ChatFlowDeleteResponse>(`/chatflows/${id}`, {
      method: 'DELETE'
    })
  }

  static async validateChatflow(data: Partial<ChatFlow>): Promise<ChatFlowResponse> {
    return this.request<ChatFlowResponse>('/chatflows/validate', {
      method: 'POST',
      data
    })
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