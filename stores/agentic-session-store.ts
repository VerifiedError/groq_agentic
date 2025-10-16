import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AgenticSession {
  id: string
  userId: number
  title: string
  model: string
  settings: string | null
  totalCost: number
  inputTokens: number
  outputTokens: number
  messageCount: number
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
}

export interface AgenticMessage {
  id: string
  sessionId: string
  role: string
  content: string
  cost: number
  inputTokens: number
  outputTokens: number
  toolCalls: string | null
  createdAt: string
}

interface AgenticSessionState {
  // State
  sessions: AgenticSession[]
  activeSessionId: string | null
  messages: AgenticMessage[]
  isLoading: boolean
  isLoadingMessages: boolean
  error: string | null

  // Actions - Session Management
  setSessions: (sessions: AgenticSession[]) => void
  addSession: (session: AgenticSession) => void
  updateSession: (id: string, updates: Partial<AgenticSession>) => void
  deleteSession: (id: string) => void
  setActiveSession: (id: string | null) => void

  // Actions - Message Management
  setMessages: (messages: AgenticMessage[]) => void
  addMessage: (message: AgenticMessage) => void
  clearMessages: () => void

  // Actions - Loading/Error States
  setLoading: (isLoading: boolean) => void
  setLoadingMessages: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // API Actions
  fetchSessions: () => Promise<void>
  fetchSessionMessages: (sessionId: string) => Promise<void>
  createSession: (data: { title?: string; model: string; settings?: any }) => Promise<AgenticSession | null>
  updateSessionTitle: (id: string, title: string) => Promise<void>
  deleteSessionById: (id: string) => Promise<void>

  // Getters
  getActiveSession: () => AgenticSession | undefined
  getSessionById: (id: string) => AgenticSession | undefined
  getTotalCost: () => number
  getTotalMessages: () => number
}

const useAgenticSessionStore = create<AgenticSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      activeSessionId: null,
      messages: [],
      isLoading: false,
      isLoadingMessages: false,
      error: null,

      // Session Management Actions
      setSessions: (sessions) => set({ sessions }),

      addSession: (session) => set((state) => ({
        sessions: [session, ...state.sessions],
        activeSessionId: session.id,
      })),

      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),

      deleteSession: (id) => set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== id)
        const newActiveId = state.activeSessionId === id
          ? (newSessions.length > 0 ? newSessions[0].id : null)
          : state.activeSessionId

        return {
          sessions: newSessions,
          activeSessionId: newActiveId,
          messages: state.activeSessionId === id ? [] : state.messages,
        }
      }),

      setActiveSession: (id) => set({
        activeSessionId: id,
        messages: [], // Clear messages when switching sessions
      }),

      // Message Management Actions
      setMessages: (messages) => set({ messages }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),

      clearMessages: () => set({ messages: [] }),

      // Loading/Error Actions
      setLoading: (isLoading) => set({ isLoading }),

      setLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

      setError: (error) => set({ error }),

      // API Actions
      fetchSessions: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/agentic/sessions')
          if (!response.ok) {
            throw new Error('Failed to fetch sessions')
          }
          const data = await response.json()
          set({ sessions: data.sessions, isLoading: false })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      fetchSessionMessages: async (sessionId) => {
        set({ isLoadingMessages: true, error: null })
        try {
          const response = await fetch(`/api/agentic/sessions/${sessionId}/messages`)
          if (!response.ok) {
            throw new Error('Failed to fetch messages')
          }
          const data = await response.json()
          set({ messages: data.messages, isLoadingMessages: false })
        } catch (error: any) {
          set({ error: error.message, isLoadingMessages: false })
        }
      },

      createSession: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/agentic/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            throw new Error('Failed to create session')
          }

          const result = await response.json()
          const newSession = result.session

          set((state) => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: newSession.id,
            isLoading: false,
          }))

          return newSession
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          return null
        }
      },

      updateSessionTitle: async (id, title) => {
        try {
          const response = await fetch(`/api/agentic/sessions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          })

          if (!response.ok) {
            throw new Error('Failed to update session')
          }

          const result = await response.json()
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === id ? result.session : s
            ),
          }))
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      deleteSessionById: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/agentic/sessions/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete session')
          }

          set((state) => {
            const newSessions = state.sessions.filter((s) => s.id !== id)
            const newActiveId = state.activeSessionId === id
              ? (newSessions.length > 0 ? newSessions[0].id : null)
              : state.activeSessionId

            return {
              sessions: newSessions,
              activeSessionId: newActiveId,
              messages: state.activeSessionId === id ? [] : state.messages,
              isLoading: false,
            }
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      // Getters
      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find((s) => s.id === activeSessionId)
      },

      getSessionById: (id) => {
        return get().sessions.find((s) => s.id === id)
      },

      getTotalCost: () => {
        return get().sessions.reduce((total, s) => total + s.totalCost, 0)
      },

      getTotalMessages: () => {
        return get().sessions.reduce((total, s) => total + s.messageCount, 0)
      },
    }),
    {
      name: 'agentic-session-storage',
      partialize: (state) => ({
        // Only persist the active session ID
        activeSessionId: state.activeSessionId,
      }),
    }
  )
)

export default useAgenticSessionStore
