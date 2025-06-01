import { useState, useEffect } from 'react'
import { Message } from './ChatWindow'
import { chatStorage } from '@/services/chatStorage'

export type ChatSession = {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatHistoryProps {
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  onClearAll: () => void
}

export function ChatHistory({
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Load sessions from storage on mount
  useEffect(() => {
    const loadSessions = () => {
      // Remove empty sessions before loading
      chatStorage.removeEmptySessions()
      
      const storedSessions = chatStorage.getAllSessions()
      console.log('Loaded sessions:', storedSessions)
      setSessions(storedSessions)
    }

    // Load initial sessions
    loadSessions()

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatSessions' && e.newValue !== e.oldValue) {
        console.log('Storage changed in another tab:', e.newValue)
        loadSessions()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  const handleNewChat = async () => {
    if (isCreating) return

    try {
      setIsCreating(true)
      
      // Create new session and update state in one go
      const newSession = chatStorage.createSession()
      console.log('Created new session:', newSession)
      
      // Update local state with the new session
      setSessions(prev => [newSession, ...prev])
      
      // Notify parent
      onNewChat()
    } catch (error) {
      console.error('Error creating new chat:', error)
      setSessions(chatStorage.getAllSessions())
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    try {
      chatStorage.deleteSession(sessionId)
      // Update local state directly
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      onDeleteSession(sessionId)
    } catch (error) {
      console.error('Error deleting session:', error)
      // Reload sessions in case of error
      setSessions(chatStorage.getAllSessions())
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all chat sessions? This cannot be undone.')) {
      try {
        chatStorage.clearAllSessions()
        // Update local state directly
        setSessions([])
        onClearAll()
      } catch (error) {
        console.error('Error clearing all sessions:', error)
        // Reload sessions in case of error
        setSessions(chatStorage.getAllSessions())
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        disabled={isCreating}
        className={`
          flex items-center gap-2 m-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 
          hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
          ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>{isCreating ? 'Creating...' : 'New Chat'}</span>
      </button>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No chat history</p>
            <p className="text-sm mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer
                  ${currentSessionId === session.id
                    ? 'bg-gray-200 dark:bg-gray-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  transition-colors
                `}
                onClick={() => onSelectSession(session.id)}
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {session.title}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(session.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-opacity"
                >
                  <svg className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {sessions.length > 0 && (
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 m-2 p-2 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear All Chats</span>
        </button>
      )}
    </div>
  )
} 