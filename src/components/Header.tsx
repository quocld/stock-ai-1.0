'use client'

interface HeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
  onNewChat: () => void
}

export function Header({ onToggleSidebar, isSidebarOpen, onNewChat }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        {/* Sidebar Toggle Button */}
        <button
          id="sidebar-toggle"
          onClick={() => {
            console.log('Header toggle button clicked')
            onToggleSidebar()
          }}
          className={`
            p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
            rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            relative group
            ${isSidebarOpen ? 'md:hidden' : ''}
          `}
          aria-label="Toggle sidebar"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Sidebar
          </div>
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={`
            p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
            rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            relative group
            ${isSidebarOpen ? 'md:hidden' : ''}
          `}
          aria-label="New Chat"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
            />
          </svg>
          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            New Chat
          </div>
        </button>

        {/* Title - only show when sidebar is closed */}
        {!isSidebarOpen && (
          <h1 className="text-lg font-normal text-gray-900 dark:text-white">StockGPT</h1>
        )}
      </div>
      <div className="flex items-center space-x-4 hidden md:flex">
        <div className="relative group">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Information"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {/* Info Tooltip */}
          <div className="absolute right-0 -bottom-16 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-blue-400">AI:</span>
                <span>Llama 4 Scout (Groq)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">Data:</span>
                <span>Yahoo Finance</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">Author:</span>
                <span>Quoc Le</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 