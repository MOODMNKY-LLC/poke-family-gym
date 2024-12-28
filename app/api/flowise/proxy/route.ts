import { NextResponse } from 'next/server'
import { validateFlowiseConfig } from '@/app/lib/flowise/config'
import axios, { AxiosError } from 'axios'

export async function POST(request: Request) {
  try {
    const config = validateFlowiseConfig()
    const { endpoint, method = 'GET', body } = await request.json()

    // Remove any leading or trailing slashes from the endpoint and base URL
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '')
    const baseUrl = config.apiUrl.replace(/\/+$/g, '')

    // Always ensure we have the /api/v1 prefix
    const apiPath = cleanEndpoint.startsWith('api/v1') ? cleanEndpoint : `api/v1/${cleanEndpoint}`
    const url = `${baseUrl}/${apiPath}`

    console.debug('[Flowise Proxy] Request:', {
      originalEndpoint: endpoint,
      cleanEndpoint,
      baseUrl,
      apiPath,
      finalUrl: url,
      method,
      hasBody: !!body,
      apiKey: config.apiKey ? '(set)' : '(missing)'
    })

    // Make direct request to Flowise API
    try {
      const response = await axios({
        url,
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        data: body,
        validateStatus: null, // Don't throw on any status code
        timeout: 10000 // 10 second timeout
      })

      console.debug('[Flowise Proxy] Response:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers['content-type'],
        dataType: typeof response.data,
        isHtml: typeof response.data === 'string' && (
          response.data.trim().startsWith('<!DOCTYPE') || 
          response.data.trim().startsWith('<html')
        )
      })

      // Handle HTML responses
      if (
        typeof response.data === 'string' && (
          response.data.trim().startsWith('<!DOCTYPE') || 
          response.data.trim().startsWith('<html')
        )
      ) {
        console.error('[Flowise Proxy] Received HTML response:', {
          url,
          status: response.status,
          preview: response.data.substring(0, 200)
        })
        
        return NextResponse.json({
          error: 'Received HTML instead of JSON response',
          details: {
            url,
            status: response.status,
            contentType: response.headers['content-type'],
            preview: response.data.substring(0, 200)
          }
        }, { status: 502 })
      }

      // Handle successful JSON responses
      if (response.headers['content-type']?.includes('application/json')) {
        return NextResponse.json(response.data, { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }

      // Handle unknown response types
      return NextResponse.json({
        error: 'Invalid response format',
        details: {
          url,
          status: response.status,
          contentType: response.headers['content-type'],
          responseType: typeof response.data
        }
      }, { status: 502 })

    } catch (requestError) {
      console.error('[Flowise Proxy] Request failed:', {
        error: requestError,
        url,
        method,
        status: requestError instanceof AxiosError ? requestError.response?.status : undefined
      })

      if (requestError instanceof AxiosError) {
        return NextResponse.json({
          error: requestError.message,
          details: {
            code: requestError.code,
            status: requestError.response?.status,
            data: requestError.response?.data
          }
        }, { status: requestError.response?.status || 500 })
      }

      throw requestError // Let the outer catch handle other errors
    }
  } catch (error) {
    console.error('[Flowise Proxy] Error:', error)

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? { 
        name: error.name,
        stack: error.stack
      } : undefined
    }, { status: 500 })
  }
} 