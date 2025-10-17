/**
 * Reasoning State Store
 * Manages reasoning state independently from message state
 * Enables persistent streaming even when new messages arrive
 */

import { create } from 'zustand'

export interface ReasoningState {
  // Message ID -> reasoning text mapping
  reasoningByMessage: Record<string, string>

  // Message ID -> completion status mapping
  isCompleteByMessage: Record<string, boolean>

  // Currently streaming message IDs
  streamingMessageIds: Set<string>

  // Actions
  setReasoning: (messageId: string, reasoning: string, isComplete?: boolean) => void
  appendReasoning: (messageId: string, reasoningChunk: string) => void
  markReasoningComplete: (messageId: string) => void
  clearReasoning: (messageId: string) => void
  clearAllReasoning: () => void
  isReasoningStreaming: (messageId: string) => boolean
  getReasoning: (messageId: string) => string | undefined
  isReasoningComplete: (messageId: string) => boolean
}

export const useReasoningStore = create<ReasoningState>((set, get) => ({
  reasoningByMessage: {},
  isCompleteByMessage: {},
  streamingMessageIds: new Set<string>(),

  setReasoning: (messageId, reasoning, isComplete = false) => {
    set((state) => ({
      reasoningByMessage: {
        ...state.reasoningByMessage,
        [messageId]: reasoning,
      },
      isCompleteByMessage: {
        ...state.isCompleteByMessage,
        [messageId]: isComplete,
      },
      streamingMessageIds: isComplete
        ? new Set([...state.streamingMessageIds].filter(id => id !== messageId))
        : new Set([...state.streamingMessageIds, messageId]),
    }))
  },

  appendReasoning: (messageId, reasoningChunk) => {
    set((state) => {
      const currentReasoning = state.reasoningByMessage[messageId] || ''
      return {
        reasoningByMessage: {
          ...state.reasoningByMessage,
          [messageId]: currentReasoning + reasoningChunk,
        },
        streamingMessageIds: new Set([...state.streamingMessageIds, messageId]),
      }
    })
  },

  markReasoningComplete: (messageId) => {
    set((state) => ({
      isCompleteByMessage: {
        ...state.isCompleteByMessage,
        [messageId]: true,
      },
      streamingMessageIds: new Set([...state.streamingMessageIds].filter(id => id !== messageId)),
    }))
  },

  clearReasoning: (messageId) => {
    set((state) => {
      const { [messageId]: _, ...remainingReasoning } = state.reasoningByMessage
      const { [messageId]: __, ...remainingComplete } = state.isCompleteByMessage
      return {
        reasoningByMessage: remainingReasoning,
        isCompleteByMessage: remainingComplete,
        streamingMessageIds: new Set([...state.streamingMessageIds].filter(id => id !== messageId)),
      }
    })
  },

  clearAllReasoning: () => {
    set({
      reasoningByMessage: {},
      isCompleteByMessage: {},
      streamingMessageIds: new Set(),
    })
  },

  isReasoningStreaming: (messageId) => {
    return get().streamingMessageIds.has(messageId)
  },

  getReasoning: (messageId) => {
    return get().reasoningByMessage[messageId]
  },

  isReasoningComplete: (messageId) => {
    return get().isCompleteByMessage[messageId] ?? false
  },
}))

/**
 * Hook to use reasoning for a specific message
 */
export function useMessageReasoning(messageId: string | undefined) {
  const store = useReasoningStore()

  if (!messageId) {
    return {
      reasoning: undefined,
      isStreaming: false,
      isComplete: false,
      setReasoning: () => {},
      appendReasoning: () => {},
      markComplete: () => {},
    }
  }

  return {
    reasoning: store.getReasoning(messageId),
    isStreaming: store.isReasoningStreaming(messageId),
    isComplete: store.isReasoningComplete(messageId),
    setReasoning: (reasoning: string, isComplete?: boolean) =>
      store.setReasoning(messageId, reasoning, isComplete),
    appendReasoning: (chunk: string) =>
      store.appendReasoning(messageId, chunk),
    markComplete: () =>
      store.markReasoningComplete(messageId),
  }
}
