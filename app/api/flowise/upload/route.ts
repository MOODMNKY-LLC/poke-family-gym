import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { flowiseUpload, handleFlowiseError } from '../config'

// POST /api/flowise/upload - Upload a file
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const chatflowId = formData.get('chatflowId')?.toString()
    const files = formData.getAll('files')

    if (!chatflowId) {
      return NextResponse.json(
        { error: 'Chatflow ID is required' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // First, verify the chatflow exists and is deployed
    const supabase = createClient()
    const { data: chatflow, error: chatflowError } = await supabase
      .from('chat_flow')
      .select('*')
      .eq('id', chatflowId)
      .single()

    if (chatflowError || !chatflow) {
      return NextResponse.json(
        { error: 'Chatflow not found' },
        { status: 404 }
      )
    }

    if (!chatflow.deployed) {
      return NextResponse.json(
        { error: 'Chatflow is not deployed' },
        { status: 400 }
      )
    }

    // Upload files to Flowise
    const uploadFormData = new FormData()
    files.forEach(file => {
      uploadFormData.append('files', file)
    })

    const response = await flowiseUpload(`chatflows/${chatflowId}/uploadFile`, uploadFormData, {
      method: 'POST'
    })

    // Store file metadata in Supabase
    const fileMetadata = response.files.map((file: any) => ({
      chatflowid: chatflowId,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      createdDate: new Date().toISOString()
    }))

    const { error: metadataError } = await supabase
      .from('file_uploads')
      .insert(fileMetadata)

    if (metadataError) {
      console.warn('Failed to store file metadata:', metadataError)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in POST /api/flowise/upload:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// GET /api/flowise/upload - List uploaded files
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams
    const chatflowId = searchParams.get('chatflowId')

    if (!chatflowId) {
      return NextResponse.json(
        { error: 'Chatflow ID is required' },
        { status: 400 }
      )
    }

    // Get file metadata from Supabase
    const supabase = createClient()
    const { data: files, error: filesError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('chatflowid', chatflowId)
      .order('createdDate', { ascending: false })

    if (filesError) {
      throw filesError
    }

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error in GET /api/flowise/upload:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// DELETE /api/flowise/upload - Delete an uploaded file
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams
    const chatflowId = searchParams.get('chatflowId')
    const filename = searchParams.get('filename')

    if (!chatflowId || !filename) {
      return NextResponse.json(
        { error: 'Chatflow ID and filename are required' },
        { status: 400 }
      )
    }

    // Delete file from Flowise
    await flowiseUpload(`chatflows/${chatflowId}/deleteFile`, new FormData(), {
      method: 'DELETE',
      body: JSON.stringify({ filename })
    })

    // Delete file metadata from Supabase
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('chatflowid', chatflowId)
      .eq('filename', filename)

    if (deleteError) {
      console.warn('Failed to delete file metadata:', deleteError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/flowise/upload:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 