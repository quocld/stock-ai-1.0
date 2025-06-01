'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChatLayout } from '@/components/ChatLayout'
import { ChatSidebar } from '@/components/ChatSidebar'
import { ChatSession } from '@/components/ChatHistory'
import { chatStorage } from '@/services/chatStorage'

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Always show sidebar on desktop
      if (!mobile) {
        setIsSidebarOpen(true)
      }
    }

    // Initial check
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNewChat = useCallback(() => {
    const newSession = chatStorage.createSession()
    setCurrentSessionId(newSession.id)
    // Close sidebar on mobile after creating new chat
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [isMobile])

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Close sidebar on mobile after selecting a session
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [isMobile])

  const handleDeleteSession = useCallback((sessionId: string) => {
    chatStorage.deleteSession(sessionId)
    if (sessionId === currentSessionId) {
      const sessions = chatStorage.getAllSessions()
      setCurrentSessionId(sessions.length > 0 ? sessions[0].id : null)
    }
  }, [currentSessionId])

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all chat sessions? This cannot be undone.')) {
      chatStorage.clearAllSessions()
      setCurrentSessionId(null)
    }
  }, [])

  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    chatStorage.updateSession(updatedSession.id, updatedSession)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    console.log('Toggle button clicked')
    console.log('Current sidebar state:', isSidebarOpen)
    setIsSidebarOpen(prev => {
      console.log('Setting sidebar to:', !prev)
      return !prev
    })
  }, [isSidebarOpen])

  // Add effect to monitor sidebar state
  useEffect(() => {
    console.log('Sidebar state changed to:', isSidebarOpen)
  }, [isSidebarOpen])

  return (
    <div className="relative h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Chat Sidebar */}
      <ChatSidebar
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className={`
        absolute inset-0 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'md:left-64' : 'left-0'}
      `}>
        <ChatLayout
          sessionId={currentSessionId}
          onSessionUpdate={handleSessionUpdate}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  )
}
