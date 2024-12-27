import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError, isAxiosError } from 'axios'

const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL
const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

// Create axios instance for server-side requests
const flowiseServer = axios.create({
  baseURL: `${FLOWISE_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${FLOWISE_API_KEY}`
  }
})

// Add response interceptor for debugging
flowiseServer.interceptors.response.use(
  (response) => {
    console.debug('Flowise server response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      dataPreview: typeof response.data === 'object' ? Object.keys(response.data) : typeof response.data
    })
    return response
  },
  (error) => {
    if (isAxiosError(error)) {
      console.error('Server response error:', {
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/flowise/proxy', '')
    
    console.debug('Proxying GET request:', { path })
    
    const response = await flowiseServer.get(path)
    return NextResponse.json(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Proxy GET error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to proxy request',
          details: error.response?.data
        }), 
        { status: error.response?.status || 500 }
      )
    }
    return new NextResponse(
      JSON.stringify({ error: 'An unknown error occurred' }), 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/flowise/proxy', '')
    const body = await request.json()
    
    // Handle method override for DELETE requests
    if (body._method === 'DELETE') {
      console.debug('Proxying DELETE request via POST:', { path })
      const response = await flowiseServer.delete(path)
      return NextResponse.json(response.data)
    }
    
    console.debug('Proxying POST request:', { path, body })
    const response = await flowiseServer.post(path, body)
    return NextResponse.json(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Proxy POST error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to proxy request',
          details: error.response?.data
        }), 
        { status: error.response?.status || 500 }
      )
    }
    return new NextResponse(
      JSON.stringify({ error: 'An unknown error occurred' }), 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/flowise/proxy', '')
    const body = await request.json()
    
    console.debug('Proxying PUT request:', { path, body })
    
    const response = await flowiseServer.put(path, body)
    return NextResponse.json(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Proxy PUT error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to proxy request',
          details: error.response?.data
        }), 
        { status: error.response?.status || 500 }
      )
    }
    return new NextResponse(
      JSON.stringify({ error: 'An unknown error occurred' }), 
      { status: 500 }
    )
  }
} 