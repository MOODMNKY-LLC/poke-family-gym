import axios, { AxiosError, isAxiosError } from 'axios'
import type { ChatFlow } from '@/app/api/flowise/types'

const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL
const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

// Create axios instance with default config
const flowiseClient = axios.create({
  baseURL: typeof window !== 'undefined' 
    ? '/api/flowise'  // Use proxy route in browser
    : `${FLOWISE_API_URL}/api/v1`, // Direct API access on server
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${FLOWISE_API_KEY}`
  }
})

// Add request interceptor for debugging
flowiseClient.interceptors.request.use(
  (config) => {
    console.debug('Making Flowise request:', {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers?.Authorization,
      hasBody: !!config.data
    })
    return config
  },
  (error) => {
    if (isAxiosError(error)) {
      console.error('Request error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging and error handling
flowiseClient.interceptors.response.use(
  (response) => {
    console.debug('Flowise response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      dataPreview: typeof response.data === 'object' ? Object.keys(response.data) : typeof response.data
    })
    return response.data
  },
  (error) => {
    if (isAxiosError(error)) {
      console.error('Response error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }
    return Promise.reject(error)
  }
)

// Flowise API functions
export const FlowiseAPI = {
  // Get all chatflows
  async getChatflows(): Promise<ChatFlow[]> {
    try {
      return await flowiseClient.get('/chatflows')
    } catch (error) {
      console.error('Error fetching chatflows:', error)
      throw error
    }
  },

  // Get a specific chatflow
  async getChatflow(id: string): Promise<ChatFlow> {
    try {
      return await flowiseClient.get(`/chatflows/${id}`)
    } catch (error) {
      console.error('Error fetching chatflow:', error)
      throw error
    }
  },

  // Create a new chatflow
  async createChatflow(chatflow: Partial<ChatFlow>): Promise<ChatFlow> {
    try {
      return await flowiseClient.post('/chatflows', chatflow)
    } catch (error) {
      console.error('Error creating chatflow:', error)
      throw error
    }
  },

  // Update a chatflow
  async updateChatflow(id: string, chatflow: Partial<ChatFlow>): Promise<ChatFlow> {
    try {
      const response = await flowiseClient.put(`/proxy/chatflows/${id}`, chatflow)
      return response.data
    } catch (error) {
      console.error('Error updating chatflow:', error)
      if (isAxiosError(error)) {
        console.error('Response error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        })
      }
      throw error
    }
  },

  // Delete a chatflow
  async deleteChatflow(id: string): Promise<void> {
    try {
      // Use a dedicated delete endpoint in our proxy
      await flowiseClient.post('/proxy/delete-chatflow', { id })
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      throw error
    }
  },

  // Deploy a chatflow
  async deployChatflow(id: string): Promise<ChatFlow> {
    try {
      return await flowiseClient.post(`/chatflows/${id}/deploy`)
    } catch (error) {
      console.error('Error deploying chatflow:', error)
      throw error
    }
  },

  // Undeploy a chatflow
  async undeployChatflow(id: string): Promise<ChatFlow> {
    try {
      return await flowiseClient.post(`/chatflows/${id}/undeploy`)
    } catch (error) {
      console.error('Error undeploying chatflow:', error)
      throw error
    }
  }
} 