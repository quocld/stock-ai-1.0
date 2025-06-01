'use client'

import { useState, useCallback } from 'react'
import { ChatWindow } from '@/components/ChatWindow'
import { ChatHistory, ChatSession } from '@/components/ChatHistory'

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add new session to localStorage
    const storedSessions = localStorage.getItem('chatSessions')
    const sessions = storedSessions ? JSON.parse(storedSessions) : []
    sessions.unshift(newSession)
    localStorage.setItem('chatSessions', JSON.stringify(sessions))

    // Switch to new session
    setCurrentSessionId(newSession.id)
  }, [])

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
  }, [])

  const handleDeleteSession = useCallback((sessionId: string) => {
    const storedSessions = localStorage.getItem('chatSessions')
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions)
      const updatedSessions = sessions.filter((s: ChatSession) => s.id !== sessionId)
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions))

      // If deleted session was current, switch to first available session or null
      if (sessionId === currentSessionId) {
        setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null)
      }
    }
  }, [currentSessionId])

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all chat sessions? This cannot be undone.')) {
      localStorage.removeItem('chatSessions')
      setCurrentSessionId(null)
    }
  }, [])

  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    const storedSessions = localStorage.getItem('chatSessions')
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions)
      const sessionIndex = sessions.findIndex((s: ChatSession) => s.id === updatedSession.id)
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = updatedSession
        localStorage.setItem('chatSessions', JSON.stringify(sessions))
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Chat Assistant</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleNewChat}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'w-64' : 'w-0'}
          transition-all duration-300 ease-in-out
          overflow-hidden
        `}>
          <ChatHistory
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow
            sessionId={currentSessionId}
            onSessionUpdate={handleSessionUpdate}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2 px-4 text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p>Developed by Le Quoc</p>
      </footer>
    </div>
  )
}
