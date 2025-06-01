'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ChatSession } from './ChatHistory'
import { chatStorage } from '@/services/chatStorage'
import ReactMarkdown from 'react-markdown'

// Regular expression to match stock symbols (1-5 uppercase letters)
const STOCK_SYMBOL_REGEX = /\$([A-Z]{1,5})\b/g

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
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  const MIN_UPDATE_INTERVAL = 50 // Increased from 300ms to 500ms for slower typing
  const scrollTimeoutRef = useRef<number | null>(null)
  const isScrollingRef = useRef(false)

  // Add this constant for placeholder height
  const PLACEHOLDER_HEIGHT = '200px' // Adjust this value as needed

  // Add constant for fixed width
  const MESSAGE_WIDTH = 'min(calc(100% - 3rem), 48rem)' // 3rem for avatar space, 48rem max width

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const container = document.querySelector('.chat-container')
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [messages])

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

  // Add back the updateStreamingMessage function
  const updateStreamingMessage = (content: string) => {
    console.log('123123 [ChatWindow] updateStreamingMessage called with content:', content)
    setStreamingMessage(content)
  }

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
    setMessages(prev => [...prev, userMessage])
    
    // Scroll the latest message to the top
    setTimeout(() => {
      const container = document.querySelector('.chat-container')
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 100)

    setIsLoading(true)
    setStreamingMessage('')
    setIsStreaming(true)

    try {
      console.log('Sending request to server...')
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

      console.log('Server response received, starting to read stream...')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let currentMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream reading complete')
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('Stream complete')
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
                setMessages(prev => [...prev, assistantMessage])
                setStreamingMessage('')
                setIsStreaming(false)
              }
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                console.log('123123 [ChatWindow] Content chunk:', parsed.content)
                currentMessage += parsed.content
                updateStreamingMessage(currentMessage)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
              if (data.trim()) {
                console.log('Treating as plain text:', data)
                currentMessage += data
                updateStreamingMessage(currentMessage)
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
      setIsStreaming(false)
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Add these styles at the top of the component
  const chatContainerStyles = {
    scrollBehavior: 'smooth' as const,
    overflowY: 'auto' as const,
    height: '100%',
    willChange: 'scroll-position' as const,
  }

  return (
    <div id="chat-window" className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto chat-container">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 md:px-6 pb-[50vh]">
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
                <div key={message.id} data-message-id={message.id}>
                  <MessageBubble
                    message={message}
                    isLoading={false}
                  />
                </div>
              ))}
              {isStreaming && (
                <div 
                  className="flex items-start"
                  style={{ 
                    minHeight: PLACEHOLDER_HEIGHT,
                  }}
                >
                  <div className="flex-1 max-w-[85%] md:max-w-[75%]">
                    <div className="rounded-3xl px-4 py-2.5 break-words text-gray-900 dark:text-gray-100">
                      {streamingMessage ? (
                        <div className="prose dark:prose-invert max-w-none prose-sm">
                          <ReactMarkdown
                            components={{
                              text: ({ children }) => {
                                const text = children as string
                                return (
                                  <>
                                    {text.split(STOCK_SYMBOL_REGEX).map((part, index) => {
                                      if (index % 2 === 1) {
                                        return (
                                          <span 
                                            key={index} 
                                            className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs"
                                          >
                                            ${part}
                                          </span>
                                        )
                                      }
                                      return part
                                    })}
                                  </>
                                )
                              }
                            }}
                          >
                            {streamingMessage}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div 
                          className="h-6 rounded animate-pulse bg-gray-200 dark:bg-gray-700"
                          style={{ width: '100%' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Area - Floating Container */}
      <div id="chat-input" className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-4 pb-6">
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