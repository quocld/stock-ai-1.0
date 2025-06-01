'use client'

import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSendMessage: (content: string) => void
  isLoading: boolean
  onCancel: () => void
}

export function ChatInput({ onSendMessage, isLoading, onCancel }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center rounded-3xl bg-white/50 dark:bg-gray-800/50 border-[0.5px] border-gray-400 dark:border-gray-700/40">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          rows={3}
          className={`
            w-full resize-none rounded-3xl
            bg-transparent
            text-gray-900 dark:text-gray-100
            px-6 py-3 pr-24
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[56px] max-h-[200px]
            placeholder-gray-400 dark:placeholder-gray-500
            text-base font-medium
            transition-colors duration-200
          `}
        />
        <div className="absolute right-2 flex items-center gap-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Cancel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className={`
                p-2 rounded-2xl transition-colors
                ${message.trim() && !isLoading
                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20'
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </form>
  )
} 