import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  try {
    const { memberId, chatflowId } = await req.json()
    
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    console.debug('Processing chatflow link request:', {
      memberId,
      chatflowId,
      timestamp: new Date().toISOString()
    })

    // Create server-side client with cookie handling
    const response = new NextResponse()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set(name, '', { ...options, maxAge: 0 })
          }
        }
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify the member exists and belongs to the user's family
    const { data: member, error: checkError } = await supabase
      .from('family_members')
      .select('id, display_name, family_id')
      .eq('id', memberId)
      .single()

    if (checkError) {
      console.error('Error checking member:', {
        error: checkError,
        code: checkError.code,
        details: checkError.details,
        hint: checkError.hint,
        message: checkError.message
      })
      return NextResponse.json(
        { 
          error: 'Failed to verify member',
          details: checkError.message,
          code: checkError.code
        },
        { status: 400 }
      )
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this family
    const { data: userMember, error: userMemberError } = await supabase
      .from('family_members')
      .select('role_id, family_id')
      .eq('id', user.id)
      .single()

    if (userMemberError || !userMember) {
      return NextResponse.json(
        { error: 'User not found in any family' },
        { status: 403 }
      )
    }

    // Check if user is in the same family and is an admin
    if (userMember.family_id !== member.family_id || userMember.role_id !== '1') {
      return NextResponse.json(
        { error: 'Unauthorized to modify this family member' },
        { status: 403 }
      )
    }

    // Create a service role client for admin operations
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set(name, '', { ...options, maxAge: 0 })
          }
        }
      }
    )

    // If we're setting a chatflow_id, verify it exists in our database
    if (chatflowId) {
      // First check if chatflow exists in our database
      const { data: existingChatflow, error: chatflowError } = await adminClient
        .from('chat_flow')
        .select('id')
        .eq('id', chatflowId)
        .single()

      if (chatflowError || !existingChatflow) {
        // Chatflow doesn't exist, create it
        const { error: insertError } = await adminClient
          .from('chat_flow')
          .insert({
            id: chatflowId,
            name: 'Imported Chatflow',
            flowData: '{}',
            deployed: true,
            isPublic: false,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating chatflow record:', {
            error: insertError,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            message: insertError.message
          })
          return NextResponse.json(
            { 
              error: 'Failed to create chatflow record',
              details: insertError.message,
              code: insertError.code
            },
            { status: 400 }
          )
        }
      }
    }

    // Now update the chatflow assignment
    const { data: updated, error: updateError } = await supabase
      .from('family_members')
      .update({ 
        chatflow_id: chatflowId,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()

    if (updateError) {
      console.error('Error updating member:', {
        error: updateError,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        message: updateError.message
      })
      return NextResponse.json(
        { 
          error: 'Failed to update chatflow assignment',
          details: updateError.message,
          code: updateError.code
        },
        { status: 400 }
      )
    }

    console.debug('Successfully linked chatflow:', {
      memberId,
      chatflowId,
      updatedMember: updated?.[0],
      timestamp: new Date().toISOString()
    })

    // Merge the response cookies with the JSON response
    const jsonResponse = NextResponse.json({
      message: 'Chatflow linked successfully',
      member: updated?.[0]
    })

    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return jsonResponse

  } catch (error) {
    console.error('Error in chatflow link API:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 