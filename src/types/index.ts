// OpenRouter types
export type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export type Tool = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
  status?: 'executing' | 'complete' | 'error'
}

export type OpenRouterChatResponse = {
  id: string
  choices: Array<{
    index: number
    message: Message
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type OpenRouterStreamChunk = {
  id: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
      tool_calls?: ToolCall[]
    }
    finish_reason: string | null
  }>
}

// Parallel.ai types
export type SearchResponse = {
  search_id: string
  results: Array<{
    url: string
    title: string
    publish_date?: string
    excerpts: string[]
  }>
  warnings?: string[]
  usage?: {
    search_units: number
  }
}

export type ExtractResponse = {
  results: Array<{
    url: string
    content: string
    markdown?: string
    excerpts?: string[]
  }>
}

// App types
export type Source = {
  url: string
  title: string
  type: 'search' | 'extract'
  timestamp: number
}

export type ModelOption = {
  id: string
  name: string
  provider: 'anthropic' | 'google' | 'openai'
}

export type ResearchStatus = 'idle' | 'searching' | 'synthesizing' | 'complete' | 'error'

export type UsageMetrics = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  startTime: number
  synthesisStartTime?: number
  endTime?: number
  durationMs?: number           // Synthesis duration only
  totalDurationMs?: number      // Total time from start to finish
  tokensPerSecond?: number      // Based on actual response tokens
  responseCharCount?: number    // Character count for accurate speed calc
  estimatedCost?: number
}

export type ResearchState = {
  status: ResearchStatus
  model: string
  currentResponse: string
  toolCalls: ToolCall[]
  sources: Source[]
  error: string | null
  lastQuery: string | null
  usage?: UsageMetrics
  progressMessage?: string
}

export type ApiKeys = {
  openrouter: string
  parallel: string
}
