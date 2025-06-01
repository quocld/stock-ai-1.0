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
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days <= 7) return 'Last 7 days'
    return 'Older'
  }

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const groups: { [key: string]: ChatSession[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 days': [],
      'Older': []
    }

    sessions.forEach(session => {
      const group = formatDate(session.updatedAt)
      groups[group].push(session)
    })

    return Object.entries(groups).filter(([, sessions]) => sessions.length > 0)
  }

  const handleNewChat = async () => {
    if (isCreating) return

    try {
      setIsCreating(true)
      
      // Create new session and update state in one go
      const newSession = chatStorage.createSession()
      
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
        className="flex items-center w-full px-4 py-3 text-base text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg 
          className="w-6 h-6 mr-3 text-gray-700 dark:text-gray-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
          />
        </svg>
        New Chat
      </button>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto mt-2">
        {sessions.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400">
            <p>No chat history</p>
            <p className="text-sm mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupSessionsByDate(sessions).map(([group, groupSessions]) => (
              <div key={group} className="py-2">
                <div className="px-4 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {group}
                </div>
                <div className="space-y-1">
                  {groupSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`
                        flex items-center justify-between w-full px-4 py-2.5 text-base
                        ${currentSessionId === session.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-semibold'
                          : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                        }
                        transition-colors group
                      `}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <svg 
                          className="w-5 h-5 mr-2.5 text-gray-600 dark:text-gray-300 flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                          />
                        </svg>
                        <span className="truncate">{session.title}</span>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-opacity cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            handleDeleteSession(session.id)
                          }
                        }}
                      >
                        <svg 
                          className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
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