'use client'

import { useState, useEffect } from 'react'
import { ChatHistory } from './ChatHistory'
import { ChatSession } from './ChatHistory'

interface ChatSidebarProps {
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  onClearAll: () => void
  isOpen: boolean
  onClose: () => void
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Add effect to monitor isOpen prop
  useEffect(() => {
    console.log('ChatSidebar isOpen changed to:', isOpen)
  }, [isOpen])

  // Check if we're on mobile and handle resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      console.log('Is mobile:', mobile)
      setIsMobile(mobile)
    }

    // Initial check
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle click outside on mobile
  useEffect(() => {
    if (!isMobile) return

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('chat-sidebar')
      const toggleButton = document.getElementById('sidebar-toggle')
      
      if (isOpen && 
          sidebar && 
          !sidebar.contains(event.target as Node) &&
          toggleButton &&
          !toggleButton.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen, onClose])

  return (
    <>
      {/* Chat History Sidebar */}
      <aside
        id="chat-sidebar"
        className={`
          fixed md:relative
          top-0 left-0
          h-full
          w-[280px] md:w-64
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          shadow-lg md:shadow-none
          z-40
          transition-transform duration-300 ease-in-out
          ${isOpen 
            ? 'translate-x-0' 
            : '-translate-x-full'
          }
        `}
        style={{
          willChange: 'transform',
        }}
      >
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
          {/* Close button - only visible on desktop */}
          <div className="hidden md:flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <h1 className="text-lg font-normal text-gray-900 dark:text-white">StockGPT</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative group"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Close Sidebar
              </div>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto w-[280px] md:w-64">
            <ChatHistory
              currentSessionId={currentSessionId}
              onSelectSession={onSelectSession}
              onNewChat={onNewChat}
              onDeleteSession={onDeleteSession}
              onClearAll={onClearAll}
            />
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
    </>
  )
} 