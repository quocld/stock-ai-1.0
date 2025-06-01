'use client'

import { useEffect, useRef, useState } from 'react'
import { Message } from './ChatWindow'
import { StockChart } from './StockChart'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'

interface MessageBubbleProps {
  message: Message
  isLoading?: boolean
  isStreaming?: boolean
}

// Regular expression to match stock symbols (1-5 uppercase letters)
const STOCK_SYMBOL_REGEX = /\$([A-Z]{1,5})\b/g

export function MessageBubble({ message, isLoading = false, isStreaming = false }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const isAssistant = message.role === 'assistant'
  const isUser = message.role === 'user'
  const isError = message.role === 'assistant' && message.content.startsWith('Error:')
  const [cursorVisible, setCursorVisible] = useState(true)

  // Detect stock symbols in assistant messages
  const stockSymbols = isAssistant ? Array.from(message.content.matchAll(STOCK_SYMBOL_REGEX)).map(match => match[1]) : []
  const hasStockChart = stockSymbols.length > 0 && !isLoading

  // Blinking cursor effect for streaming messages
  useEffect(() => {
    if (isStreaming) {
      const cursorInterval = setInterval(() => {
        setCursorVisible(prev => !prev)
      }, 500)
      return () => clearInterval(cursorInterval)
    }
  }, [isStreaming])

  // Scroll into view when streaming starts
  useEffect(() => {
    if (isLoading && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isLoading])

  // Debug logging
  useEffect(() => {
    console.log('123123 [MessageBubble] Rendering:', {
      isStreaming,
      content: message.content,
      isLoading
    })
  }, [isStreaming, message.content, isLoading])

  return (
    <div 
      ref={bubbleRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start`}
    >
      <div className={`flex flex-col gap-1 ${isUser ? 'max-w-[85%] md:max-w-[75%]' : 'max-w-[85%] md:max-w-[75%]'}`}>
        <div 
          className={`
            rounded-3xl px-4 py-2.5 break-words
            ${isUser
              ? 'bg-blue-500 text-white'
              : isError
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-gray-100'
            }
            ${isLoading ? 'animate-pulse' : ''}
          `}
        >
          <style jsx global>{`
            .typing-cursor {
              display: inline-block;
              width: 2px;
              height: 1em;
              background-color: currentColor;
              margin-left: 2px;
              vertical-align: middle;
              animation: blink 1s step-end infinite;
            }
            @keyframes blink {
              from, to { opacity: 1; }
              50% { opacity: 0; }
            }
            .prose pre {
              background-color: rgb(243 244 246);
              padding: 0.75rem;
              border-radius: 0.5rem;
              margin: 0.5rem 0;
              overflow-x: auto;
            }
            .dark .prose pre {
              background-color: rgb(31 41 55);
            }
            .prose code {
              background-color: rgb(243 244 246);
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
            }
            .dark .prose code {
              background-color: rgb(31 41 55);
            }
            .prose p {
              margin: 0.5rem 0;
            }
            .prose p:first-child {
              margin-top: 0;
            }
            .prose p:last-child {
              margin-bottom: 0;
            }
          `}</style>
          {isLoading && !message.content ? (
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            isAssistant ? (
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
                          {isStreaming && cursorVisible && <span className="typing-cursor" />}
                        </>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none prose-sm">
                {message.content.split(STOCK_SYMBOL_REGEX).map((part, index) => {
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
              </div>
            )
          )}
        </div>
        {hasStockChart && (
          <div className="w-full max-w-xl mt-2">
            <StockChart symbol={stockSymbols[0]} />
          </div>
        )}
      </div>
    </div>
  )
} 