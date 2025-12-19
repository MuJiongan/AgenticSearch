import { useReducer } from 'react'
import type { ResearchState, ToolCall, Source, ApiKeys, UsageMetrics } from '../types/index.js'
import { executeResearchQuery } from '../lib/orchestration/research-agent.js'
import { useLocalStorage } from './useLocalStorage.js'

type ResearchAction =
  | { type: 'START'; payload: string }
  | { type: 'TOOL_CALL'; payload: ToolCall }
  | { type: 'THINKING_CHUNK'; payload: string }
  | { type: 'STREAM_CHUNK'; payload: string }
  | { type: 'SOURCE_ADDED'; payload: Source }
  | { type: 'UPDATE_USAGE'; payload: Partial<UsageMetrics> }
  | { type: 'PROGRESS_MESSAGE'; payload: string }
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
        thinkingContent: '',
        toolCalls: [],
        sources: [],
        error: null,
        lastQuery: action.payload,
        progressMessage: 'Planning research strategy...',
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

    case 'THINKING_CHUNK': {
      // Track when thinking starts (first chunk)
      const thinkingStartTime = state.usage?.thinkingStartTime || Date.now()
      const newThinking = state.thinkingContent + action.payload

      return {
        ...state,
        status: 'thinking',
        thinkingContent: newThinking,
        progressMessage: undefined,
        usage: state.usage ? {
          ...state.usage,
          thinkingStartTime,
          thinkingCharCount: newThinking.length
        } : undefined
      }
    }

    case 'STREAM_CHUNK': {
      // Track when synthesis starts (first chunk)
      const synthesisStartTime = state.usage?.synthesisStartTime || Date.now()
      const newResponse = state.currentResponse + action.payload

      return {
        ...state,
        status: 'synthesizing',
        currentResponse: newResponse,
        progressMessage: undefined,
        usage: state.usage ? {
          ...state.usage,
          synthesisStartTime,
          responseCharCount: newResponse.length
        } : undefined
      }
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
      if (newUsage.endTime && newUsage.synthesisStartTime) {
        newUsage.durationMs = newUsage.endTime - newUsage.synthesisStartTime
        // Calculate tokens/sec based on completion tokens (output speed)
        if (newUsage.durationMs > 0 && newUsage.completionTokens > 0) {
          newUsage.tokensPerSecond = (newUsage.completionTokens / newUsage.durationMs) * 1000
        }
      }

      return {
        ...state,
        usage: newUsage
      }
    }

    case 'PROGRESS_MESSAGE':
      return {
        ...state,
        progressMessage: action.payload
      }

    case 'COMPLETE': {
      if (!state.usage) {
        return { ...state, status: 'complete' }
      }

      const endTime = Date.now()
      const synthStartTime = state.usage.synthesisStartTime || state.usage.startTime
      const durationMs = endTime - synthStartTime
      const totalDurationMs = endTime - state.usage.startTime

      // Calculate thinking duration if thinking occurred
      const thinkingDurationMs = state.usage.thinkingStartTime && state.usage.synthesisStartTime
        ? state.usage.synthesisStartTime - state.usage.thinkingStartTime
        : undefined

      // Estimate tokens from response character count (~4 chars per token average)
      const responseCharCount = state.usage.responseCharCount || state.currentResponse.length
      const estimatedResponseTokens = Math.ceil(responseCharCount / 4)

      // Calculate speed based on actual response tokens and synthesis time (excluding thinking)
      const tokensPerSecond = durationMs > 0 && estimatedResponseTokens > 0
        ? (estimatedResponseTokens / durationMs) * 1000
        : 0

      return {
        ...state,
        status: 'complete',
        usage: {
          ...state.usage,
          endTime,
          durationMs,
          totalDurationMs,
          thinkingDurationMs,
          tokensPerSecond,
          responseCharCount
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
        thinkingContent: '',
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
    thinkingContent: '',
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
        onThinkingChunk: (chunk) => {
          if (chunk) dispatch({ type: 'THINKING_CHUNK', payload: chunk })
        },
        onStreamChunk: (chunk) => {
          if (chunk) dispatch({ type: 'STREAM_CHUNK', payload: chunk })
        },
        onSourceAdded: (source) => dispatch({ type: 'SOURCE_ADDED', payload: source }),
        onUsageUpdate: (usage) => dispatch({ type: 'UPDATE_USAGE', payload: usage }),
        onProgressMessage: (message) => dispatch({ type: 'PROGRESS_MESSAGE', payload: message })
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
