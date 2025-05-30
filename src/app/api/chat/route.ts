import { NextResponse } from 'next/server'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 3 // 3 requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Available Groq models
const GROQ_MODELS = {
  LLAMA_4: 'meta-llama/llama-4-scout-17b-16e-instruct',
  LLAMA_2: 'llama2-70b-4096',
  GEMMA: 'gemma-7b-it',
} as const

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(ip)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (userRequests.count >= MAX_REQUESTS) {
    return true
  }

  userRequests.count++
  return false
}

// Convert our message format to Groq format
function convertToGroqMessages(messages: Array<{ role: string; content: string }>): ChatCompletionMessageParam[] {
  // Add system message at the start if not present
  const hasSystemMessage = messages.some(msg => msg.role === 'system')
  const systemMessage = {
    role: 'system' as const,
    content: `You are a helpful, friendly, and concise AI assistant. Keep your responses clear and to the point.

When discussing stocks, you can include a chart request using the format [chart SYMBOL] where SYMBOL is a valid stock symbol (1-5 uppercase letters).
For example: "Here's the recent performance of Apple stock: [chart AAPL]"
Only include one chart request per message, and only when specifically discussing stock performance.`
  }

  const convertedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }))

  return hasSystemMessage ? convertedMessages : [systemMessage, ...convertedMessages]
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a minute before trying again.',
          retryAfter: 60
        },
        { status: 429 }
      )
    }

    // Log the API key status (without exposing the actual key)
    console.log('Groq API Key status:', process.env.GROQ_API_KEY ? 'Present' : 'Missing')

    const { messages } = await request.json()
    console.log('Received messages:', messages)

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages)
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Groq API key is not configured')
      return NextResponse.json(
        { error: 'Groq API key is not configured. Please add GROQ_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    // Convert messages to Groq format
    const groqMessages = convertToGroqMessages(messages)
    console.log('Converted messages:', groqMessages)

    try {
      // Call Groq API with the correct model
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODELS.LLAMA_4, // Using the latest Llama 4 model
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          stream: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Groq API error: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices[0]?.message?.content

      if (!assistantMessage) {
        throw new Error('No response from Groq API')
      }

      return NextResponse.json({ message: assistantMessage })
    } catch (apiError) {
      console.error('Groq API Error:', apiError)
      
      // Handle specific API errors
      if (apiError instanceof Error) {
        if (apiError.message.includes('429')) {
          return NextResponse.json(
            { 
              error: 'Groq API rate limit exceeded. Please try again later.',
              details: 'You may need to upgrade your plan or wait before making more requests.'
            },
            { status: 429 }
          )
        }
        // Handle model deprecation errors
        if (apiError.message.includes('decommissioned') || apiError.message.includes('no longer supported')) {
          return NextResponse.json(
            { 
              error: 'The selected model is no longer supported. Please try again with a different model.',
              details: 'Available models: meta-llama/llama-4-scout-17b-16e-instruct, llama2-70b-4096, gemma-7b-it'
            },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { 
            error: `Groq API Error: ${apiError.message}`,
          },
          { status: 500 }
        )
      }
      throw apiError // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error processing chat request:', error)
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 