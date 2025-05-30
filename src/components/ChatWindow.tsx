'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

export type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // Scroll to bottom when loading state changes (for charts)
  useEffect(() => {
    if (!isLoading) {
      // Use setTimeout to ensure the chart has rendered
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [isLoading])

  const handleSendMessage = async (content: string) => {
    // Cancel any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setStreamingMessage('')

    try {
      // Send all messages to maintain context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Handle SSE response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let currentMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        // Each chunk might contain multiple lines
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Add the complete message to messages array
              if (currentMessage) {
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  content: currentMessage,
                  role: 'assistant',
                  timestamp: new Date(),
                }
                setMessages((prev) => [...prev, assistantMessage])
                setStreamingMessage('')
              }
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                currentMessage += parsed.content
                setStreamingMessage(currentMessage)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, 'Line:', line)
              // If it's not JSON, treat it as plain text
              if (data.trim()) {
                currentMessage += data
                setStreamingMessage(currentMessage)
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted')
        return
      }

      console.error('Error sending message:', error)
      // Add error message to chat with more details
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: error instanceof Error 
          ? `Error: ${error.message}`
          : 'Sorry, there was an error sending your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4">
            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h2 className="text-xl font-semibold">Welcome to AI Chat Assistant</h2>
            <p className="text-center max-w-md">
              I'm your AI assistant. I can help you with various tasks, including analyzing stock data.
              Try asking me about stock prices or any other questions!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isError={message.role === 'assistant' && message.content.startsWith('Error:')}
              />
            ))}
            {streamingMessage && (
              <MessageBubble
                key="streaming"
                message={{
                  id: 'streaming',
                  content: streamingMessage,
                  role: 'assistant',
                  timestamp: new Date(),
                }}
                isStreaming={true}
              />
            )}
          </>
        )}
        {isLoading && !streamingMessage && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium text-white">
              AI
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading} 
          onCancel={() => abortControllerRef.current?.abort()}
          isStreaming={!!streamingMessage}
        />
      </div>
    </div>
  )
} 