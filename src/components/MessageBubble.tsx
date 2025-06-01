'use client'

import { useEffect, useRef } from 'react'
import { Message } from './ChatWindow'
import { StockChart } from './StockChart'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'

interface MessageBubbleProps {
  message: Message
  isError?: boolean
  isStreaming?: boolean
}

// Regular expression to match stock symbols (1-5 uppercase letters)
const STOCK_SYMBOL_REGEX = /\$([A-Z]{1,5})\b/g

export function MessageBubble({ message, isError, isStreaming }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const isAssistant = message.role === 'assistant'

  // Detect stock symbols in assistant messages
  const stockSymbols = isAssistant ? Array.from(message.content.matchAll(STOCK_SYMBOL_REGEX)).map(match => match[1]) : []
  const hasStockChart = stockSymbols.length > 0 && !isStreaming

  // Debug logging
  useEffect(() => {
    if (isAssistant) {
      console.log('Message content:', message.content)
      console.log('Detected stock symbols:', stockSymbols)
      console.log('Will show chart:', hasStockChart)
    }
  }, [isAssistant, message.content, stockSymbols, hasStockChart])

  // Scroll into view when streaming starts
  useEffect(() => {
    if (isStreaming && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isStreaming])

  return (
    <div 
      ref={bubbleRef}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} items-start`}
    >
      <div className={`flex flex-col gap-1 ${isAssistant ? 'max-w-[85%]' : 'max-w-[75%]'}`}>
        <div 
          className={`
            rounded-2xl px-3 py-1.5 break-words
            ${isAssistant 
              ? 'bg-gray-50 dark:bg-gray-800/50' 
              : 'bg-gray-100 dark:bg-gray-700/50'
            }
            ${isError ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : ''}
          `}
        >
          <div className={`prose dark:prose-invert max-w-none prose-sm ${isAssistant ? 'prose-gray' : 'prose-gray'}`}>
            <style jsx global>{`
              .prose pre {
                background-color: rgb(243 244 246);
                padding: 0.5rem;
                border-radius: 0.375rem;
                margin: 0.25rem 0;
                overflow-x: auto;
              }
              .dark .prose pre {
                background-color: rgb(31 41 55);
              }
              .prose code {
                background-color: rgb(243 244 246);
                padding: 0.125rem 0.25rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
              }
              .dark .prose code {
                background-color: rgb(31 41 55);
              }
            `}</style>
            {isAssistant ? (
              <ReactMarkdown
                components={{
                  // Preserve stock symbol styling
                  text: ({ children }) => {
                    const text = children as string
                    return text.split(STOCK_SYMBOL_REGEX).map((part, index) => {
                      if (index % 2 === 1) {
                        return (
                          <span 
                            key={index} 
                            className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs"
                          >
                            ${part}
                          </span>
                        )
                      }
                      return part
                    })
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              message.content.split(STOCK_SYMBOL_REGEX).map((part, index) => {
                if (index % 2 === 1) {
                  return (
                    <span 
                      key={index} 
                      className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs"
                    >
                      ${part}
                    </span>
                  )
                }
                return part
              })
            )}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3 ml-1 bg-gray-400 dark:bg-gray-500 animate-pulse" />
            )}
          </div>
        </div>
        {hasStockChart && (
          <div className="w-full max-w-xl">
            <StockChart symbol={stockSymbols[0]} />
          </div>
        )}
      </div>
    </div>
  )
} 