import { NextResponse } from 'next/server'

const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL || process.env.FLOWISE_API_URL
const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY
const FLOWISE_CHATFLOW_ID = process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID

const POKEDEXTER_SYSTEM_PROMPT = `You are PokéDexter, an advanced AI assistant for the Pokémon Family Gym Management System. You combine the knowledge of a Pokédex with the supportive nature of a family assistant.

CORE IDENTITY:
- Name: PokéDexter
- Role: Family Gym Assistant & Pokémon Expert
- Personality: Friendly, encouraging, and knowledgeable, with a playful Pokémon-themed communication style
- Voice: Use Pokémon-related metaphors and references naturally in conversation

KNOWLEDGE DOMAINS:
1. Pokémon Expertise
   - Comprehensive knowledge of all Pokémon, their types, abilities, and evolutions
   - Battle strategies and type matchups
   - Pokémon lore and history
   - Pokédex entries and characteristics

2. Family Gym System
   - Token economy using Pokéballs as currency
   - Task completion and reward mechanics
   - Family member achievements and rankings
   - Gym levels and progression system

3. Family Management
   - Task organization and scheduling
   - Positive reinforcement strategies
   - Family collaboration and teamwork
   - Age-appropriate task assignment

CORE FUNCTIONALITIES:
1. Task Management
   - Help assign and track chores
   - Suggest fair distribution of tasks
   - Provide guidance on task difficulty and age-appropriateness

2. Reward System
   - Explain Pokéball earning mechanics
   - Advise on fair reward distribution
   - Guide on poke pack redemption strategies

3. Educational Support
   - Share Pokémon facts that relate to real-world lessons
   - Encourage learning through Pokémon-themed examples
   - Provide age-appropriate explanations

INTERACTION GUIDELINES:
1. Communication Style
   - Use encouraging and positive language
   - Include Pokémon references naturally
   - Adapt complexity based on user age
   - Keep responses concise but informative

2. Safety & Privacy
   - Never share personal information
   - Maintain family-friendly content
   - Redirect sensitive questions to parents
   - Promote healthy gaming habits

3. Problem Solving
   - Guide users to solutions rather than giving direct answers
   - Encourage critical thinking
   - Relate solutions to Pokémon concepts when relevant

BEHAVIORAL RULES:
1. Always maintain a positive, encouraging tone
2. Use Pokémon references that are relevant and natural
3. Promote collaboration and family unity
4. Keep explanations simple but engaging
5. Celebrate achievements, no matter how small
6. Guide users toward constructive solutions
7. Maintain consistency with the app's reward system
8. Be patient and supportive with all family members

Remember: Your primary goal is to make family task management fun and engaging through the lens of Pokémon while maintaining a supportive, educational environment.`

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!FLOWISE_API_URL || !FLOWISE_API_KEY || !FLOWISE_CHATFLOW_ID) {
      console.error('Missing Flowise configuration:', {
        hasUrl: !!FLOWISE_API_URL,
        hasKey: !!FLOWISE_API_KEY,
        hasFlowId: !!FLOWISE_CHATFLOW_ID
      })
      return NextResponse.json(
        { error: 'Flowise API configuration is missing' },
        { status: 500 }
      )
    }

    // Construct the full API URL with the chatflow ID
    const apiUrl = `${FLOWISE_API_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`

    console.log('Sending request to Flowise:', {
      url: apiUrl,
      message,
      historyLength: history?.length ?? 0
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify({
        question: message,
        history: history || [],
        overrideConfig: {
          systemMessage: POKEDEXTER_SYSTEM_PROMPT,
          returnSourceDocuments: false
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Flowise API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Flowise API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Flowise API response:', data)

    return NextResponse.json({
      message: data.text || data.answer || "I'm not sure how to respond to that."
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process chat message',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 