import { validateFlowiseConfig } from './config'

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type')
  console.debug('Flowise API Response:', {
    status: response.status,
    statusText: response.statusText,
    contentType,
    url: response.url
  })

  if (!contentType?.includes('application/json')) {
    const text = await response.text()
    console.error('Unexpected response type from Flowise:', {
      contentType,
      text: text.substring(0, 200), // Log first 200 chars
      status: response.status,
      url: response.url
    })
    throw new Error(`Flowise API returned HTML instead of JSON. Status: ${response.status}. This usually means the server is not running or the URL is incorrect.`)
  }

  const data = await response.json()
  return data
}

async function flowiseRequest(endpoint: string, options: RequestInit = {}) {
  try {
    // Ensure endpoint starts with /chatflows
    const apiPath = endpoint.startsWith('/chatflows') ? endpoint : `/chatflows${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    console.debug('Making proxy request:', {
      endpoint: apiPath,
      method: options.method || 'GET',
      bodyLength: options.body ? (options.body as string).length : 0
    })

    const response = await fetch('/api/flowise/proxy', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: apiPath,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
      console.error('Proxy request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error
      })
      throw new Error(errorData.error || `Proxy request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('Request failed:', {
      error,
      endpoint,
      method: options.method || 'GET'
    })
    throw error
  }
}

export const FlowiseAPI = {
  async getChatflows() {
    return flowiseRequest('/chatflows')
  },

  async getChatflow(id: string) {
    return flowiseRequest(`/chatflows/${id}`)
  },

  async createChatflow(data: any) {
    console.debug('Creating chatflow with data:', {
      ...data,
      chatbotConfig: '[REDACTED]',
      flowData: '[REDACTED]'
    })
    return flowiseRequest('/chatflows', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async updateChatflow(id: string, data: any) {
    console.debug('Updating chatflow with data:', {
      id,
      ...data,
      chatbotConfig: '[REDACTED]',
      flowData: '[REDACTED]'
    })
    return flowiseRequest(`/chatflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  async deleteChatflow(id: string) {
    return flowiseRequest(`/chatflows/${id}`, {
      method: 'DELETE'
    })
  }
} 