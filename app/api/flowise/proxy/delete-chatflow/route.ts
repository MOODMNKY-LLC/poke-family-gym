import { NextRequest, NextResponse } from 'next/server'
import axios, { isAxiosError } from 'axios'

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

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Chatflow ID is required' }), 
        { status: 400 }
      )
    }
    
    console.debug('Deleting chatflow:', { id })
    
    const response = await flowiseServer.delete(`/chatflows/${id}`)
    return NextResponse.json(response.data)
  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Error deleting chatflow:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to delete chatflow',
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