'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ChatSession } from './ChatHistory'
import { chatStorage } from '@/services/chatStorage'

export type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatWindowProps {
  sessionId: string | null
  onSessionUpdate: (session: ChatSession) => void
}

export function ChatWindow({ sessionId, onSessionUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load messages from session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const session = chatStorage.getSession(sessionId)
      if (session) {
        setMessages(session.messages)
      } else {
        console.log('Session not found:', sessionId)
        setMessages([])
      }
    } else {
      setMessages([])
    }
  }, [sessionId])

  // Update session when messages change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const session = chatStorage.getSession(sessionId)
      if (session) {
        const updatedSession = {
          ...session,
          messages,
          updatedAt: new Date()
        }
        chatStorage.updateSession(sessionId, updatedSession)
        onSessionUpdate(updatedSession)
      }
    }
  }, [messages, sessionId, onSessionUpdate])

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

    if (sessionId) {
      chatStorage.addMessage(sessionId, userMessage)
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
                if (sessionId) {
                  chatStorage.addMessage(sessionId, assistantMessage)
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
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: error instanceof Error 
          ? `Error: ${error.message}`
          : 'Sorry, there was an error sending your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      }
      if (sessionId) {
        chatStorage.addMessage(sessionId, errorMessage)
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div 
          ref={chatContainerRef}
          className="max-w-3xl mx-auto px-4 py-6 space-y-4 md:px-6"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg font-medium">Start a new conversation</p>
                <p className="text-sm mt-1">Type a message below to begin</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLoading={false}
                />
              ))}
              {streamingMessage && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    content: streamingMessage,
                    role: 'assistant',
                    timestamp: new Date(),
                  }}
                  isLoading={true}
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area - Floating Container */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-4 pb-6">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onCancel={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort()
                  abortControllerRef.current = null
                }
                setIsLoading(false)
                setStreamingMessage('')
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 