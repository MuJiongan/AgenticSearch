import { useReducer } from 'react'
import type { ResearchState, ToolCall, Source, ApiKeys, UsageMetrics } from '../types/index.js'
import { executeResearchQuery } from '../lib/orchestration/research-agent.js'
import { useLocalStorage } from './useLocalStorage.js'

type ResearchAction =
  | { type: 'START'; payload: string }
  | { type: 'TOOL_CALL'; payload: ToolCall }
  | { type: 'STREAM_CHUNK'; payload: string }
  | { type: 'SOURCE_ADDED'; payload: Source }
  | { type: 'UPDATE_USAGE'; payload: Partial<UsageMetrics> }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; payload: string }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'RESET' }

function researchReducer(state: ResearchState, action: ResearchAction): ResearchState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        status: 'searching',
        currentResponse: '',
        toolCalls: [],
        sources: [],
        error: null,
        lastQuery: action.payload,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          startTime: Date.now()
        }
      }

    case 'TOOL_CALL': {
      // Update existing tool call or add new one
      const existingIndex = state.toolCalls.findIndex(tc => tc.id === action.payload.id)
      if (existingIndex >= 0) {
        const newToolCalls = [...state.toolCalls]
        newToolCalls[existingIndex] = action.payload
        return {
          ...state,
          toolCalls: newToolCalls
        }
      }
      return {
        ...state,
        toolCalls: [...state.toolCalls, action.payload]
      }
    }

    case 'STREAM_CHUNK':
      return {
        ...state,
        status: 'synthesizing',
        currentResponse: state.currentResponse + action.payload
      }

    case 'SOURCE_ADDED': {
      // Deduplicate sources by URL
      const exists = state.sources.some(s => s.url === action.payload.url)
      if (exists) {
        return state
      }
      return {
        ...state,
        sources: [...state.sources, action.payload]
      }
    }

    case 'UPDATE_USAGE': {
      const newUsage = { ...state.usage, ...action.payload } as UsageMetrics

      // Calculate derived metrics if we have the necessary data
      if (newUsage.endTime && newUsage.startTime) {
        newUsage.durationMs = newUsage.endTime - newUsage.startTime
        if (newUsage.durationMs > 0 && newUsage.totalTokens > 0) {
          newUsage.tokensPerSecond = (newUsage.totalTokens / newUsage.durationMs) * 1000
        }
      }

      return {
        ...state,
        usage: newUsage
      }
    }

    case 'COMPLETE': {
      if (!state.usage) {
        return { ...state, status: 'complete' }
      }

      const endTime = Date.now()
      const durationMs = endTime - state.usage.startTime
      const tokensPerSecond = durationMs > 0 && state.usage.totalTokens > 0
        ? (state.usage.totalTokens / durationMs) * 1000
        : 0

      return {
        ...state,
        status: 'complete',
        usage: {
          ...state.usage,
          endTime,
          durationMs,
          tokensPerSecond
        }
      }
    }

    case 'ERROR':
      return { ...state, status: 'error', error: action.payload }

    case 'SET_MODEL':
      return { ...state, model: action.payload }

    case 'RESET':
      return {
        ...state,
        status: 'idle',
        currentResponse: '',
        toolCalls: [],
        sources: [],
        error: null,
        lastQuery: null,
        usage: undefined
      }

    default:
      return state
  }
}

export function useResearchAgent() {
  const [savedModel, setSavedModel] = useLocalStorage<string>('research-agent-model', 'google/gemini-3-flash-preview')

  const [state, dispatch] = useReducer(researchReducer, {
    status: 'idle',
    model: savedModel,
    currentResponse: '',
    toolCalls: [],
    sources: [],
    error: null,
    lastQuery: null,
    usage: undefined
  })

  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('research-agent-keys', {
    openrouter: '',
    parallel: ''
  })

  const submitQuery = async (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    if (!apiKeys.openrouter?.trim() || !apiKeys.parallel?.trim()) {
      dispatch({ type: 'ERROR', payload: 'API keys not configured. Please add your OpenRouter and Parallel API keys.' })
      return
    }

    dispatch({ type: 'START', payload: trimmedQuery })

    try {
      await executeResearchQuery({
        query: trimmedQuery,
        model: state.model,
        openrouterApiKey: apiKeys.openrouter.trim(),
        parallelApiKey: apiKeys.parallel.trim(),
        onToolCall: (call) => dispatch({ type: 'TOOL_CALL', payload: call }),
        onStreamChunk: (chunk) => {
          if (chunk) dispatch({ type: 'STREAM_CHUNK', payload: chunk })
        },
        onSourceAdded: (source) => dispatch({ type: 'SOURCE_ADDED', payload: source }),
        onUsageUpdate: (usage) => dispatch({ type: 'UPDATE_USAGE', payload: usage })
      })

      dispatch({ type: 'COMPLETE' })
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message || 'An error occurred during research' })
    }
  }

  const retry = () => {
    if (state.lastQuery) {
      submitQuery(state.lastQuery)
    }
  }

  return {
    state,
    apiKeys,
    setApiKeys,
    submitQuery,
    selectModel: (model: string) => {
      if (!model) return
      setSavedModel(model)
      dispatch({ type: 'SET_MODEL', payload: model })
    },
    reset: () => dispatch({ type: 'RESET' }),
    retry
  }
}
