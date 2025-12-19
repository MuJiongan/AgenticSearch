import type { Message, Tool, ToolCall, OpenRouterChatResponse } from '../../types/index.js'

export type ChatParams = {
  model: string
  messages: Message[]
  tools?: Tool[]
  tool_choice?: 'auto' | 'required' | 'none'
  stream?: boolean
  onStream?: (chunk: string) => void
  onToolCalls?: (toolCalls: any[]) => void
}

export type StreamingResult = {
  content: string
  toolCalls: ToolCall[]
  finishReason: string | null
  // OpenRouter reasoning details for reasoning models
  reasoningDetails?: any[]
  // Token usage from the API
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type ChatResult = OpenRouterChatResponse | StreamingResult
