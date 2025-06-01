'use client'

import type { ChatSession } from './ChatHistory'
import { ChatWindow } from './ChatWindow'
import { Header } from './Header'

interface ChatLayoutProps {
  sessionId: string | null
  onSessionUpdate: (session: ChatSession) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onNewChat: () => void
}

export function ChatLayout({
  sessionId,
  onSessionUpdate,
  isSidebarOpen,
  onToggleSidebar,
  onNewChat,
}: ChatLayoutProps) {
  return (
    <main className="flex flex-col h-full relative">
      <Header 
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onNewChat={onNewChat}
      />
      <div 
        className="flex-1 overflow-hidden relative"
        style={{
          transition: 'all 300ms ease-in-out',
        }}
      >
        <ChatWindow
          sessionId={sessionId}
          onSessionUpdate={onSessionUpdate}
        />
      </div>
    </main>
  )
} 