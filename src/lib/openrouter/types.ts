import type { Message, Tool, OpenRouterChatResponse } from '../../types/index.js'

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

export type ChatResult = OpenRouterChatResponse | void
