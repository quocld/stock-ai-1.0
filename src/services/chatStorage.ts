import { ChatSession } from '@/components/ChatHistory'
import { Message } from '@/components/ChatWindow'

const STORAGE_KEY = 'chatSessions'

export interface ChatStorageService {
  getAllSessions: () => ChatSession[]
  getSession: (sessionId: string) => ChatSession | null
  createSession: () => ChatSession
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
  addMessage: (sessionId: string, message: Message) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  removeEmptySessions: () => void
}

class LocalStorageChatService implements ChatStorageService {
  private parseSession(session: Record<string, unknown>): ChatSession {
    return {
      id: session.id as string,
      title: session.title as string,
      createdAt: new Date(session.createdAt as string),
      updatedAt: new Date(session.updatedAt as string),
      messages: ((session.messages || []) as Array<Record<string, unknown>>).map((msg) => ({
        id: msg.id as string,
        content: msg.content as string,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.timestamp as string)
      }))
    }
  }

  private getStoredSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      
      const parsedSessions = JSON.parse(stored)
      if (!Array.isArray(parsedSessions)) {
        console.error('Invalid stored sessions format')
        localStorage.removeItem(STORAGE_KEY)
        return []
      }

      return parsedSessions.map(session => this.parseSession(session))
    } catch (error: unknown) {
      console.error('Error reading chat sessions from localStorage:', error)
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
  }

  private saveSessions(sessions: ChatSession[]): void {
    try {
      const sessionsToStore = sessions.map(session => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      }))

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToStore))
    } catch (error: unknown) {
      console.error('Error saving chat sessions to localStorage:', error)
    }
  }

  getAllSessions(): ChatSession[] {
    return this.getStoredSessions()
  }

  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getStoredSessions()
    return sessions.find(s => s.id === sessionId) || null
  }

  createSession(): ChatSession {
    try {
      const sessions = this.getStoredSessions()
      
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const newId = `session_${timestamp}_${random}`

      const newSession: ChatSession = {
        id: newId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp)
      }

      const updatedSessions = [newSession, ...sessions]
      this.saveSessions(updatedSessions)
      
      return newSession
    } catch (error: unknown) {
      console.error('Error creating new session:', error)
      throw error
    }
  }

  updateSession(sessionId: string, updates: Partial<ChatSession>): void {
    const sessions = this.getStoredSessions()
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)
    
    if (sessionIndex === -1) {
      console.error('Session not found:', sessionId)
      return
    }

    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date()
    }

    sessions[sessionIndex] = updatedSession
    this.saveSessions(sessions)
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getStoredSessions()
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    this.saveSessions(updatedSessions)
    
    // Clean up any remaining empty sessions
    this.removeEmptySessions()
  }

  clearAllSessions(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  addMessage(sessionId: string, message: Message): void {
    try {
      const sessions = this.getStoredSessions()
      const sessionIndex = sessions.findIndex(s => s.id === sessionId)
      
      if (sessionIndex === -1) {
        console.error('Session not found:', sessionId)
        return
      }

      const session = sessions[sessionIndex]
      const updatedMessages = [...session.messages, message]

      let title = session.title
      if (session.title === 'New Chat' && message.role === 'user') {
        title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      }

      const updatedSession = {
        ...session,
        messages: updatedMessages,
        title,
        updatedAt: new Date()
      }

      sessions[sessionIndex] = updatedSession
      this.saveSessions(sessions)
      this.removeEmptySessions()
    } catch (error: unknown) {
      console.error('Error adding message:', error)
    }
  }

  updateSessionTitle(sessionId: string, title: string): void {
    this.updateSession(sessionId, { title })
  }

  removeEmptySessions(): void {
    try {
      const sessions = this.getStoredSessions()
      const nonEmptySessions = sessions.filter(session => session.messages.length > 0)
      
      if (nonEmptySessions.length !== sessions.length) {
        console.log('Removing empty sessions')
        this.saveSessions(nonEmptySessions)
      }
    } catch (error) {
      console.error('Error removing empty sessions:', error)
    }
  }
}

export const chatStorage = new LocalStorageChatService() 