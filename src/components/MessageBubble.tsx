'use client'

import { useEffect, useRef } from 'react'
import { Message } from './ChatWindow'
import { StockChart } from './StockChart'

interface MessageBubbleProps {
  message: Message
  isError?: boolean
  isStreaming?: boolean
}

// Regular expression to match stock symbols (1-5 uppercase letters)
const STOCK_SYMBOL_REGEX = /\b[A-Z]{1,5}\b/g

export function MessageBubble({ message, isError, isStreaming }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const isAssistant = message.role === 'assistant'

  // Detect stock symbols in assistant messages
  const stockSymbols = isAssistant ? message.content.match(/\$[A-Z]{1,5}/g) || [] : []
  const hasStockChart = stockSymbols.length > 0

  // Scroll into view when streaming starts
  useEffect(() => {
    if (isStreaming && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isStreaming])

  return (
    <div 
      ref={bubbleRef}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} items-end gap-2`}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium text-white">
          AI
        </div>
      )}
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div 
          className={`
            rounded-2xl px-4 py-2 break-words
            ${isAssistant 
              ? 'bg-gray-100 dark:bg-gray-700 rounded-bl-none' 
              : 'bg-blue-500 text-white rounded-br-none'
            }
            ${isError ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : ''}
          `}
        >
          <div className="prose dark:prose-invert max-w-none">
            {message.content.split(/(\$\w+)/).map((part, index) => {
              if (part.match(/^\$\w+$/)) {
                return (
                  <span 
                    key={index} 
                    className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded"
                  >
                    {part}
                  </span>
                )
              }
              return part
            })}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 dark:bg-gray-500 animate-pulse" />
            )}
          </div>
        </div>
        {hasStockChart && (
          <div className="w-full max-w-2xl">
            <StockChart symbol={stockSymbols[0].slice(1)} />
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
          You
        </div>
      )}
    </div>
  )
} 