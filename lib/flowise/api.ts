import type { 
  Document, 
  ProcessingConfig,
  ChatFlow,
  ChatFlowConfig,
  ChatFlowResponse,
  ChatFlowListResponse,
  ChatFlowDeleteResponse
} from '.'
import { validateFlowiseConfig, FlowiseAPIError } from '.'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number,
  timeout: number
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // If we get a 502/503/504, we'll retry
      if (response.status >= 502 && response.status <= 504) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      return response
    } catch (error) {
      lastError = error as Error
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error)
      
      // Don't wait on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        await sleep(Math.pow(2, attempt) * 1000)
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

export class FlowiseAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config = validateFlowiseConfig()
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${config.apiUrl}${normalizedEndpoint}`

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...options.headers
    }

    console.debug('Flowise API Request:', {
      url,
      method: options.method || 'GET',
      headers: {
        ...headers,
        'Authorization': 'Bearer [REDACTED]'
      }
    })

    try {
      const response = await fetchWithRetry(
        url,
        { ...options, headers },
        config.maxRetries || 3,
        config.timeout || 30000
      )

      console.debug('Flowise API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Get response content type
      const contentType = response.headers.get('content-type')
      
      // Get response text
      const text = await response.text()
      console.debug('Flowise API Response Body:', text.substring(0, 500))

      // Check if response is HTML (error page)
      if (contentType?.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
        console.error('Received HTML instead of JSON:', {
          url,
          contentType,
          status: response.status,
          statusText: response.statusText,
          htmlPreview: text.substring(0, 500)
        })

        // Try to extract error message from HTML if possible
        const errorMatch = text.match(/<pre>([^]*?)<\/pre>/)
        const errorMessage = errorMatch ? errorMatch[1].trim() : 'Server returned HTML instead of JSON'

        throw new FlowiseAPIError(
          'Invalid API response: ' + errorMessage,
          'INVALID_RESPONSE_TYPE',
          { 
            url, 
            contentType,
            htmlPreview: text.substring(0, 500),
            status: response.status
          }
        )
      }

      // Try to parse JSON response
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch (e) {
        console.error('Error parsing JSON response:', {
          error: e,
          text: text.substring(0, 500),
          url,
          status: response.status
        })
        throw new FlowiseAPIError(
          'Invalid JSON response from server',
          'INVALID_JSON',
          { 
            url, 
            status: response.status,
            responseText: text.substring(0, 500)
          }
        )
      }

      // Handle API errors
      if (!response.ok) {
        const errorMessage = data?.message || response.statusText
        const errorCode = data?.code || 'API_ERROR'
        
        // Special handling for common errors
        if (response.status === 502) {
          throw new FlowiseAPIError(
            'The Flowise server is currently unavailable. Please try again later.',
            'SERVER_UNAVAILABLE'
          )
        }
        
        if (response.status === 401) {
          throw new FlowiseAPIError(
            'Invalid API key or unauthorized access.',
            'UNAUTHORIZED'
          )
        }
        
        throw new FlowiseAPIError(
          errorMessage,
          errorCode,
          {
            ...data?.details,
            status: response.status,
            url
          }
        )
      }

      // For list responses, wrap in expected format if not already wrapped
      if (Array.isArray(data) && endpoint.includes('/chatflows')) {
        if (!data[0]?.id) {
          console.warn('Unexpected chatflows response format:', data)
        }
        return {
          chatflows: data,
          total: data.length,
          page: 1,
          pageSize: data.length
        } as T
      }

      return data as T
    } catch (error) {
      if (error instanceof FlowiseAPIError) {
        throw error
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FlowiseAPIError(
          'Request timed out. The server took too long to respond.',
          'TIMEOUT'
        )
      }

      console.error('Flowise API request failed:', error)
      throw new FlowiseAPIError(
        error instanceof Error ? error.message : 'Failed to communicate with Flowise API',
        'CONNECTION_ERROR',
        { originalError: error }
      )
    }
  }

  static async getChatFlows(): Promise<ChatFlowListResponse> {
    return this.request('/chatflows')
  }

  static async getChatFlow(id: string): Promise<ChatFlowResponse> {
    return this.request(`/chatflows/${id}`)
  }

  static async createChatflow(data: Partial<ChatFlow>): Promise<ChatFlowResponse> {
    return this.request('/chatflows', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  static async updateChatflow(
    id: string,
    data: Partial<ChatFlow>
  ): Promise<ChatFlowResponse> {
    return this.request(`/chatflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  static async deleteChatflow(id: string): Promise<ChatFlowDeleteResponse> {
    return this.request(`/chatflows/${id}`, {
      method: 'DELETE'
    })
  }

  static async validateChatflow(data: Partial<ChatFlow>): Promise<ChatFlowResponse> {
    return this.request('/chatflows/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  static async deployChatflow(id: string): Promise<ChatFlowResponse> {
    return this.request(`/chatflows/${id}/deploy`, {
      method: 'POST'
    })
  }

  static async undeployChatflow(id: string): Promise<ChatFlowResponse> {
    return this.request(`/chatflows/${id}/undeploy`, {
      method: 'POST'
    })
  }

  static async getChatflowConfig(id: string): Promise<ChatFlowConfig> {
    return this.request(`/chatflows/${id}/config`)
  }

  static async updateChatflowConfig(
    id: string,
    config: Partial<ChatFlowConfig>
  ): Promise<ChatFlowConfig> {
    return this.request(`/chatflows/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config)
    })
  }
}

export class DocumentStoreAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { apiUrl, apiKey } = validateFlowiseConfig()
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${apiUrl}${normalizedEndpoint}`

    const isFormData = options.body instanceof FormData
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers
    }

    console.debug('Document Store API Request:', {
      url,
      method: options.method || 'GET',
      headers: {
        ...headers,
        'Authorization': 'Bearer [REDACTED]'
      }
    })

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      console.debug('Document Store API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Get response content type
      const contentType = response.headers.get('content-type')
      
      // Get response text
      const text = await response.text()
      console.debug('Document Store API Response Body:', text.substring(0, 500))

      // Check if response is HTML
      if (contentType?.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
        console.error('Received HTML instead of JSON:', {
          url,
          contentType,
          status: response.status,
          statusText: response.statusText,
          htmlPreview: text.substring(0, 500)
        })

        // Try to extract error message from HTML if possible
        const errorMatch = text.match(/<pre>([^]*?)<\/pre>/)
        const errorMessage = errorMatch ? errorMatch[1].trim() : 'Server returned HTML instead of JSON'

        throw new FlowiseAPIError(
          'Invalid API response: ' + errorMessage,
          'INVALID_RESPONSE_TYPE',
          { 
            url, 
            contentType,
            htmlPreview: text.substring(0, 500),
            status: response.status
          }
        )
      }

      // Try to parse JSON response
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch (e) {
        console.error('Error parsing JSON response:', {
          error: e,
          text: text.substring(0, 500),
          url,
          status: response.status
        })
        throw new FlowiseAPIError(
          'Invalid JSON response from server',
          'INVALID_JSON',
          { 
            url, 
            status: response.status,
            responseText: text.substring(0, 500)
          }
        )
      }

      // Handle API errors
      if (!response.ok) {
        throw new FlowiseAPIError(
          data?.message || 'An error occurred',
          data?.code || 'API_ERROR',
          {
            ...data?.details,
            status: response.status,
            url
          }
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof FlowiseAPIError) {
        throw error
      }

      console.error('Document Store API request failed:', error)
      throw new FlowiseAPIError(
        error instanceof Error ? error.message : 'Failed to communicate with Document Store API',
        'CONNECTION_ERROR',
        { originalError: error }
      )
    }
  }

  static async getDocuments(): Promise<Document[]> {
    return this.request('/documentstore')
  }

  static async uploadDocuments(files: File[], config?: ProcessingConfig): Promise<Document[]> {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    if (config) {
      formData.append('config', JSON.stringify(config))
    }

    return this.request('/documentstore/upload', {
      method: 'POST',
      body: formData
    })
  }

  static async deleteDocument(id: string): Promise<void> {
    return this.request(`/documentstore/${id}`, {
      method: 'DELETE'
    })
  }

  static async getDocumentStatus(id: string): Promise<{ status: string }> {
    return this.request(`/documentstore/status/${id}`)
  }
} 