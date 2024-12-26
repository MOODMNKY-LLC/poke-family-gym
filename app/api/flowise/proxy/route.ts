import { NextResponse } from 'next/server'
import { validateFlowiseConfig } from '@/app/lib/flowise/config'

export async function POST(request: Request) {
  try {
    const config = validateFlowiseConfig()
    const { endpoint, method = 'GET', body } = await request.json()

    // Ensure endpoint starts with /api/v1
    const apiPath = endpoint.startsWith('/api/v1') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    const url = `${config.apiUrl}${apiPath}`

    console.debug('Proxy request to Flowise:', {
      url,
      method,
      hasBody: !!body
    })

    const response = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: body ? JSON.stringify(body) : undefined
    })

    // Check for HTML response
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('text/html')) {
      const text = await response.text()
      console.error('Received HTML response from Flowise:', {
        status: response.status,
        url,
        preview: text.substring(0, 200)
      })
      return NextResponse.json(
        { error: 'Received HTML instead of JSON. Please check if Flowise server is running and accessible.' },
        { status: 502 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Flowise API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200)
      })
      return NextResponse.json(
        { error: `Flowise API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 