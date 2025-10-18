import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  images?: string[] // For vision messages
  timestamp?: Date
}

export interface Session {
  id: string
  name: string
  model: string
  messages: Message[]
  totalCost: number
  totalTokens: number
  createdAt: Date
  updatedAt: Date
}

interface SessionStore {
  sessions: Session[]
  currentSessionId: string | null

  // Session management
  createSession: (model: string, name?: string) => Session
  deleteSession: (sessionId: string) => void
  setCurrentSession: (sessionId: string) => void
  updateSessionName: (sessionId: string, name: string) => void

  // Message management
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  clearMessages: () => void

  // Session data
  getCurrentSession: () => Session | null
  getSessionById: (sessionId: string) => Session | null

  // Persistence
  loadSessions: (sessions: Session[]) => void
  updateSessionCost: (sessionId: string, cost: number, tokens: number) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,

  createSession: (model: string, name?: string) => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: name || `Chat ${new Date().toLocaleString()}`,
      model,
      messages: [],
      totalCost: 0,
      totalTokens: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: newSession.id,
    }))

    return newSession
  },

  deleteSession: (sessionId: string) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== sessionId)
      const newCurrentId = state.currentSessionId === sessionId
        ? (newSessions[0]?.id || null)
        : state.currentSessionId

      return {
        sessions: newSessions,
        currentSessionId: newCurrentId,
      }
    })
  },

  setCurrentSession: (sessionId: string) => {
    set({ currentSessionId: sessionId })
  },

  updateSessionName: (sessionId: string, name: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, name, updatedAt: new Date() }
          : s
      ),
    }))
  },

  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    const { currentSessionId } = get()
    if (!currentSessionId) return

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [...s.messages, newMessage],
              updatedAt: new Date(),
            }
          : s
      ),
    }))
  },

  updateMessage: (messageId: string, updates: Partial<Message>) => {
    const { currentSessionId } = get()
    if (!currentSessionId) return

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
              updatedAt: new Date(),
            }
          : s
      ),
    }))
  },

  clearMessages: () => {
    const { currentSessionId } = get()
    if (!currentSessionId) return

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [], updatedAt: new Date() }
          : s
      ),
    }))
  },

  getCurrentSession: () => {
    const { sessions, currentSessionId } = get()
    return sessions.find((s) => s.id === currentSessionId) || null
  },

  getSessionById: (sessionId: string) => {
    const { sessions } = get()
    return sessions.find((s) => s.id === sessionId) || null
  },

  loadSessions: (sessions: Session[]) => {
    set({
      sessions,
      currentSessionId: sessions[0]?.id || null,
    })
  },

  updateSessionCost: (sessionId: string, cost: number, tokens: number) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              totalCost: s.totalCost + cost,
              totalTokens: s.totalTokens + tokens,
              updatedAt: new Date(),
            }
          : s
      ),
    }))
  },
}))
