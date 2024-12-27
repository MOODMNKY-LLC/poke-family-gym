import { ChatFlow } from '@/app/api/flowise/types'

const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL
const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

// Helper function to validate Flowise configuration
function validateFlowiseConfig() {
  if (!FLOWISE_API_URL || !FLOWISE_API_KEY) {
    throw new Error('Flowise API configuration missing')
  }
}

// Helper function to make requests to Flowise API
async function flowiseRequest(endpoint: string, options: RequestInit = {}) {
  validateFlowiseConfig()

  const url = `${FLOWISE_API_URL}/api/v1/${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FLOWISE_API_KEY}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type')
    let errorMessage: string

    try {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        errorMessage = errorData.error || JSON.stringify(errorData)
      } else {
        errorMessage = await response.text()
      }
    } catch (e) {
      errorMessage = response.statusText || 'Unknown error occurred'
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

// Flowise API functions
export const FlowiseAPI = {
  // Get all chatflows
  async getChatflows(): Promise<ChatFlow[]> {
    try {
      const data = await flowiseRequest('chatflows')
      return data
    } catch (error) {
      console.error('Error fetching chatflows:', error)
      throw error
    }
  },

  // Get a specific chatflow
  async getChatflow(id: string): Promise<ChatFlow> {
    try {
      const data = await flowiseRequest(`chatflows/${id}`)
      return data
    } catch (error) {
      console.error('Error fetching chatflow:', error)
      throw error
    }
  },

  // Create a new chatflow
  async createChatflow(chatflow: Partial<ChatFlow>): Promise<ChatFlow> {
    try {
      const data = await flowiseRequest('chatflows', {
        method: 'POST',
        body: JSON.stringify(chatflow)
      })
      return data
    } catch (error) {
      console.error('Error creating chatflow:', error)
      throw error
    }
  },

  // Update a chatflow
  async updateChatflow(id: string, chatflow: Partial<ChatFlow>): Promise<ChatFlow> {
    try {
      const data = await flowiseRequest(`chatflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(chatflow)
      })
      return data
    } catch (error) {
      console.error('Error updating chatflow:', error)
      throw error
    }
  },

  // Delete a chatflow
  async deleteChatflow(id: string): Promise<void> {
    try {
      await flowiseRequest(`chatflows/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      throw error
    }
  },

  // Deploy a chatflow
  async deployChatflow(id: string): Promise<ChatFlow> {
    try {
      const data = await flowiseRequest(`chatflows/${id}/deploy`, {
        method: 'POST'
      })
      return data
    } catch (error) {
      console.error('Error deploying chatflow:', error)
      throw error
    }
  },

  // Undeploy a chatflow
  async undeployChatflow(id: string): Promise<ChatFlow> {
    try {
      const data = await flowiseRequest(`chatflows/${id}/undeploy`, {
        method: 'POST'
      })
      return data
    } catch (error) {
      console.error('Error undeploying chatflow:', error)
      throw error
    }
  }
} 