import type { Message, Tool, ToolCall, OpenRouterChatResponse } from '../../types/index.js'

export type ChatParams = {
  model: string
  messages: Message[]
  tools?: Tool[]
  tool_choice?: 'auto' | 'required' | 'none'
  stream?: boolean
  include_reasoning?: boolean  // Request reasoning output for thinking models
  onStream?: (chunk: string) => void
  onThinking?: (chunk: string) => void
  onToolCalls?: (toolCalls: any[]) => void
}

export type StreamingResult = {
  content: string
  reasoning: string
  toolCalls: ToolCall[]
  finishReason: string | null
}

export type ChatResult = OpenRouterChatResponse | StreamingResult
