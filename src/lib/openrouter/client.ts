import type { OpenRouterChatResponse, ToolCall } from '../../types/index.js'
import type { ChatParams, ChatResult, StreamingResult } from './types.js'

export class OpenRouterClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    const response = await fetch('/api/openrouter/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'AgenticSearch Research Agent'
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        tools: params.tools,
        tool_choice: params.tool_choice,
        stream: params.stream ?? false,
        // Include reasoning for thinking models
        ...(params.include_reasoning && { include_reasoning: true })
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    if (!params.stream) {
      return response.json() as Promise<OpenRouterChatResponse>
    }

    // Handle SSE streaming and return accumulated result
    return this.handleStream(response, params.onStream, params.onThinking, params.onToolCalls)
  }

  private async handleStream(
    response: Response,
    onChunk?: (chunk: string) => void,
    onThinking?: (chunk: string) => void,
    onToolCalls?: (toolCalls: any[]) => void
  ): Promise<StreamingResult> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    // Accumulate data for final result
    let content = ''
    let reasoning = ''
    let finishReason: string | null = null
    // Tool calls are accumulated by index (streaming sends deltas)
    const toolCallsMap: Map<number, ToolCall> = new Map()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            if (data === '') continue

            try {
              const parsed: any = JSON.parse(data)

              // Handle provider errors sent in the stream
              if (parsed.error) {
                throw new Error(`Provider error: ${parsed.error.message} (Code: ${parsed.error.code})`)
              }

              const choice = parsed.choices?.[0]
              const delta = choice?.delta

              // Capture finish reason
              if (choice?.finish_reason) {
                finishReason = choice.finish_reason
              }

              // Handle thinking/reasoning chunks (for thinking models like Claude)
              const reasoningChunk = delta?.reasoning || delta?.reasoning_content
              if (reasoningChunk) {
                reasoning += reasoningChunk
                if (onThinking) {
                  onThinking(reasoningChunk)
                }
              }

              // Handle content chunks
              if (delta?.content) {
                content += delta.content
                if (onChunk) {
                  onChunk(delta.content)
                }
              }

              // Handle tool calls - accumulate by index
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const index = tc.index ?? 0
                  const existing = toolCallsMap.get(index)

                  if (existing) {
                    // Append to existing tool call arguments
                    if (tc.function?.arguments) {
                      existing.function.arguments += tc.function.arguments
                    }
                  } else {
                    // New tool call
                    toolCallsMap.set(index, {
                      id: tc.id || `call_${index}`,
                      type: 'function',
                      function: {
                        name: tc.function?.name || '',
                        arguments: tc.function?.arguments || ''
                      }
                    })
                  }
                }

                if (onToolCalls) {
                  onToolCalls(delta.tool_calls)
                }
              }
            } catch (e: any) {
              // If it's the error we just threw, rethrow it
              if (e.message.startsWith('Provider error:')) {
                throw e
              }
              // Otherwise ignore parse errors for malformed chunks
              console.warn('Failed to parse stream chunk:', data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Convert tool calls map to array
    const toolCalls = Array.from(toolCallsMap.values())

    return { content, reasoning, toolCalls, finishReason }
  }
}
