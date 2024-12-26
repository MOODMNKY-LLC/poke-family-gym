interface FlowiseConfig {
  apiUrl: string
  apiKey: string
}

export function validateFlowiseConfig(): FlowiseConfig {
  const apiUrl = process.env.NEXT_PUBLIC_FLOWISE_API_URL
  const apiKey = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

  if (!apiUrl || !apiKey) {
    console.error('Flowise configuration error:', {
      hasApiUrl: !!apiUrl,
      hasApiKey: !!apiKey,
      env: process.env.NODE_ENV,
      apiUrl: apiUrl || 'not set',
      // Don't log the actual key for security
      keyLength: apiKey?.length || 0
    })
    throw new Error(`Flowise API configuration missing. URL: ${apiUrl || 'not set'}`)
  }

  // Validate URL format
  try {
    new URL(apiUrl)
  } catch (e) {
    console.error('Invalid Flowise API URL:', apiUrl)
    throw new Error(`Invalid Flowise API URL: ${apiUrl}`)
  }

  // Log configuration for debugging
  console.debug('Using Flowise configuration:', {
    apiUrl,
    hasApiKey: !!apiKey,
    keyLength: apiKey.length,
    env: process.env.NODE_ENV
  })

  return {
    apiUrl: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl, // Remove trailing slash if present
    apiKey
  }
} 