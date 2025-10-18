import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  images?: string[] // For vision messages
  timestamp?: Date
  // Cost tracking (per message)
  cost?: number
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
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
  createSession: (model: string, name?: string) => Promise<Session>
  deleteSession: (sessionId: string) => Promise<void>
  setCurrentSession: (sessionId: string) => void
  updateSessionName: (sessionId: string, name: string) => Promise<void>

  // Message management
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  clearMessages: () => void

  // Session data
  getCurrentSession: () => Session | null
  getSessionById: (sessionId: string) => Session | null

  // Persistence
  loadSessions: (sessions: Session[]) => void
  loadSessionsFromDB: () => Promise<void>
  updateSessionCost: (sessionId: string, cost: number, tokens: number) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,

  createSession: async (model: string, name?: string) => {
    try {
      // Create session in database
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, name }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const { session } = await response.json()

      // Add to local state
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
      }))

      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      // Fallback to client-only session
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
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      // Delete from database
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete session')
      }

      // Remove from local state
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
    } catch (error) {
      console.error('Failed to delete session:', error)
      // Still remove from local state
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
    }
  },

  setCurrentSession: (sessionId: string) => {
    set({ currentSessionId: sessionId })
  },

  updateSessionName: async (sessionId: string, name: string) => {
    try {
      // Update in database
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to update session name')
      }

      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, name, updatedAt: new Date() }
            : s
        ),
      }))
    } catch (error) {
      console.error('Failed to update session name:', error)
      // Still update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, name, updatedAt: new Date() }
            : s
        ),
      }))
    }
  },

  addMessage: async (message: Omit<Message, 'id' | 'timestamp'>) => {
    const { currentSessionId } = get()
    if (!currentSessionId) return

    try {
      // Add message to database
      const response = await fetch(`/api/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error('Failed to add message')
      }

      const { message: savedMessage } = await response.json()

      // Update session cost if message has cost data
      if (message.cost && message.inputTokens !== undefined && message.outputTokens !== undefined) {
        const currentSession = get().sessions.find((s) => s.id === currentSessionId)
        if (currentSession) {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    totalCost: s.totalCost + (message.cost || 0),
                    totalTokens: s.totalTokens + (message.inputTokens || 0) + (message.outputTokens || 0),
                    messages: [...s.messages, savedMessage],
                    updatedAt: new Date(),
                  }
                : s
            ),
          }))
        }
      } else {
        // Add to local state without cost update
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [...s.messages, savedMessage],
                  updatedAt: new Date(),
                }
              : s
          ),
        }))
      }
    } catch (error) {
      console.error('Failed to add message:', error)
      // Fallback to client-only message
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
                totalCost: s.totalCost + (message.cost || 0),
                totalTokens: s.totalTokens + (message.inputTokens || 0) + (message.outputTokens || 0),
                updatedAt: new Date(),
              }
            : s
        ),
      }))
    }
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

  loadSessionsFromDB: async () => {
    try {
      const response = await fetch('/api/sessions')

      if (!response.ok) {
        throw new Error('Failed to load sessions')
      }

      const { sessions } = await response.json()

      // Convert date strings to Date objects
      const transformedSessions = sessions.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }))

      set({
        sessions: transformedSessions,
        currentSessionId: transformedSessions[0]?.id || null,
      })
    } catch (error) {
      console.error('Failed to load sessions from DB:', error)
      // Keep empty sessions array
    }
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
