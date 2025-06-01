import { NextRequest } from 'next/server'

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 3 // 3 requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): { limited: boolean; resetTime?: number } {
  const now = Date.now()
  const userRequests = requestCounts.get(ip)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { limited: false }
  }

  if (userRequests.count >= MAX_REQUESTS) {
    return { limited: true, resetTime: userRequests.resetTime }
  }

  userRequests.count++
  return { limited: false }
}

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const GROQ_MODELS = {
  LLAMA_4: 'meta-llama/llama-4-scout-17b-16e-instruct',
  MIXTRAL: 'mixtral-8x7b-32768',
  GEMMA: 'gemma-7b-it',
} as const

function convertToGroqMessages(messages: { role: string; content: string }[]) {
  // Add system message if not present
  if (!messages.some(m => m.role === 'system')) {
    messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. You can help with various tasks including analyzing stock data. When users ask about stock prices, you MUST include the stock symbol in your response in the format $SYMBOL (e.g., $AAPL for Apple, $GOOGL for Google). The symbol must be prefixed with $ and be in uppercase letters. This format is required for the stock chart to be displayed.'
      },
      ...messages
    ]
  }
  return messages
}

export async function POST(req: NextRequest) {
  try {
    // Check for API key
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const { limited, resetTime } = isRateLimited(ip)

    if (limited) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          resetTime: resetTime ? new Date(resetTime).toISOString() : undefined,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const groqMessages = convertToGroqMessages(messages)

    // Create a new ReadableStream for streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: GROQ_MODELS.LLAMA_4,
              messages: groqMessages,
              stream: true,
              temperature: 0.7,
              max_tokens: 1024,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            if (error.error?.message?.includes('model is decommissioned')) {
              throw new Error(
                `Model is no longer available. Please use one of these models: ${Object.values(GROQ_MODELS).join(', ')}`
              )
            }
            throw new Error(error.error?.message || `Groq API error: ${response.status}`)
          }

          if (!response.body) {
            throw new Error('No response body')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              // Skip empty lines
              if (!line.trim()) continue

              // Handle [DONE] signal
              if (line.trim() === 'data: [DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                controller.close()
                return
              }

              // Handle data lines
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6)
                  if (!jsonStr) continue

                  const parsed = JSON.parse(jsonStr)
                  const content = parsed.choices[0]?.delta?.content
                  if (content) {
                    // Send the content as a proper SSE message
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  console.error('Error parsing streaming data:', e, 'Line:', line)
                  // Continue processing other lines even if one fails
                  continue
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          // Send error as SSE message
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 