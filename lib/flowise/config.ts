import { FlowiseAPIError } from './errors'

export interface FlowiseConfig {
  apiUrl: string
  apiKey: string
}

export function validateFlowiseConfig(): FlowiseConfig {
  const apiUrl = process.env.NEXT_PUBLIC_FLOWISE_API_URL
  const apiKey = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

  if (!apiUrl) {
    throw new FlowiseAPIError(
      'NEXT_PUBLIC_FLOWISE_API_URL is not set',
      'MISSING_CONFIG'
    )
  }

  if (!apiKey) {
    throw new FlowiseAPIError(
      'NEXT_PUBLIC_FLOWISE_API_KEY is not set',
      'MISSING_CONFIG'
    )
  }

  // Clean up the URL:
  // 1. Remove trailing slashes
  // 2. Ensure /api/v1 is present
  // 3. Remove any double slashes (except after protocol)
  const baseUrl = apiUrl
    .replace(/\/+$/, '') // Remove trailing slashes
    .replace(/\/api\/v1\/?$/, '') // Remove /api/v1 if it exists
    .replace(/([^:]\/)\/+/g, '$1') // Remove double slashes

  // Add back /api/v1
  const finalUrl = `${baseUrl}/api/v1`

  console.debug('[Flowise Config] Validated config:', {
    originalUrl: apiUrl,
    cleanedUrl: baseUrl,
    finalUrl,
    hasApiKey: !!apiKey
  })

  return {
    apiUrl: finalUrl,
    apiKey
  }
} 