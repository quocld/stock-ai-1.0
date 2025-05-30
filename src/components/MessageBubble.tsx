import { Message } from './ChatWindow'
import { StockChart } from './StockChart'

interface MessageBubbleProps {
  message: Message
  isError?: boolean
}

// Regular expression to match stock symbols in chart requests
const CHART_REQUEST_REGEX = /\[chart\s+([A-Z]{1,5})\]/i

export function MessageBubble({ message, isError = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  // Extract stock symbol from chart request
  const chartMatch = message.role === 'assistant' && !isError
    ? message.content.match(CHART_REQUEST_REGEX)
    : null
  const stockSymbol = chartMatch ? chartMatch[1] : null

  // Remove the chart request from the message content
  const displayContent = stockSymbol 
    ? message.content.replace(CHART_REQUEST_REGEX, '').trim()
    : message.content

  return (
    <div
      className={`flex ${
        isUser ? 'justify-end' : 'justify-start'
      } items-end gap-2`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
          AI
        </div>
      )}
      <div className="flex flex-col gap-2 max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : isError
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-bl-none'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
          <span className={`text-xs mt-1 block ${
            isUser 
              ? 'text-blue-100' 
              : isError 
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </span>
        </div>
        {stockSymbol && (
          <div className="mt-2">
            <StockChart symbol={stockSymbol} />
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-300">
          You
        </div>
      )}
    </div>
  )
} 