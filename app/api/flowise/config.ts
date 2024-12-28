import { headers } from 'next/headers'

// Custom error class for Flowise errors
export class FlowiseError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'FlowiseError'
  }
}

export const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL
export const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

// Helper function to validate Flowise configuration
export function validateFlowiseConfig() {
  if (!FLOWISE_API_URL || !FLOWISE_API_KEY) {
    throw new FlowiseError('Flowise API configuration missing', 500)
  }
}

// Helper function to create Flowise API headers
export function createFlowiseHeaders(additionalHeaders: HeadersInit = {}) {
  const headers = new Headers(additionalHeaders)
  headers.set('Authorization', `Bearer ${FLOWISE_API_KEY}`)
  headers.set('Content-Type', 'application/json')
  return headers
}

// Helper function to make requests to Flowise API
export async function flowiseRequest(endpoint: string, options: RequestInit = {}) {
  const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL
  const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

  if (!FLOWISE_API_URL) {
    throw new FlowiseError('NEXT_PUBLIC_FLOWISE_API_URL is not configured', 500)
  }

  if (!FLOWISE_API_KEY) {
    throw new FlowiseError('NEXT_PUBLIC_FLOWISE_API_KEY is not configured', 500)
  }

  const url = `${FLOWISE_API_URL}/${endpoint}`
  
  console.debug('Making Flowise request:', {
    url,
    method: options.method,
    bodyLength: options.body ? JSON.stringify(options.body).length : 0
  })

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`,
        ...options.headers,
      },
    })

    const contentType = response.headers.get('content-type')
    const responseText = await response.text()

    console.debug('Flowise response:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      responseLength: responseText.length,
      isHtml: responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')
    })

    if (!response.ok) {
      let errorMessage: string

      try {
        if (contentType?.includes('application/json')) {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || JSON.stringify(errorData)
        } else if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          errorMessage = 'Flowise server returned HTML instead of JSON. Please check server configuration.'
        } else {
          errorMessage = responseText || response.statusText || 'Unknown error occurred'
        }
      } catch (e) {
        errorMessage = `Failed to parse error response: ${responseText}`
      }

      throw new FlowiseError(errorMessage, response.status, {
        contentType,
        responseText: responseText.substring(0, 1000) // First 1000 chars for debugging
      })
    }

    if (!contentType?.includes('application/json')) {
      throw new FlowiseError(
        'Flowise server returned non-JSON response. Please check server configuration.',
        500,
        {
          contentType,
          responsePreview: responseText.substring(0, 1000)
        }
      )
    }

    try {
      return JSON.parse(responseText)
    } catch (e) {
      throw new FlowiseError(
        'Failed to parse JSON response from Flowise server',
        500,
        {
          error: e,
          responsePreview: responseText.substring(0, 1000)
        }
      )
    }
  } catch (error) {
    if (error instanceof FlowiseError) {
      throw error
    }
    
    console.error('Flowise request failed:', {
      url,
      error
    })
    
    throw new FlowiseError(
      error instanceof Error ? error.message : 'Failed to communicate with Flowise server',
      500,
      { originalError: error }
    )
  }
}

// Helper function to handle file uploads
export async function flowiseUpload(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
) {
  validateFlowiseConfig()

  const url = `${FLOWISE_API_URL}/${endpoint}`
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${FLOWISE_API_KEY}`)
  // Don't set Content-Type for multipart/form-data

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: formData,
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new FlowiseError(
        `Flowise upload failed: ${response.status} - ${errorText}`,
        response.status,
        {
          endpoint,
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        }
      )
    }

    return response.json()
  } catch (error) {
    console.error('Flowise upload failed:', {
      endpoint,
      error
    })
    throw error
  }
}

// Helper function to validate chatflow configuration
export function validateChatflowConfig(config: any) {
  const requiredFields = ['name', 'flowData']
  const missingFields = requiredFields.filter(field => !config[field])
  
  if (missingFields.length > 0) {
    throw new FlowiseError(`Missing required fields: ${missingFields.join(', ')}`, 400)
  }
}

// Helper function to handle errors
export function handleFlowiseError(error: unknown): { error: string; details?: any } {
  console.error('Handling Flowise error:', error)
  
  if (error instanceof FlowiseError) {
    return {
      error: error.message,
      details: error.details
    }
  }
  
  if (error instanceof Error) {
    return {
      error: error.message
    }
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    return {
      error: errorObj.message || 'An unknown error occurred',
      details: errorObj.details || errorObj
    }
  }
  
  return { error: 'An unknown error occurred' }
} 