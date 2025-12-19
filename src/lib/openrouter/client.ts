import type { OpenRouterChatResponse } from '../../types/index.js'
import type { ChatParams, ChatResult } from './types.js'

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

    // Handle SSE streaming
    await this.handleStream(response, params.onStream, params.onThinking, params.onToolCalls)
  }

  private async handleStream(
    response: Response,
    onChunk?: (chunk: string) => void,
    onThinking?: (chunk: string) => void,
    onToolCalls?: (toolCalls: any[]) => void
  ): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

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

              const delta = parsed.choices?.[0]?.delta

              // Handle thinking/reasoning chunks (for thinking models like Claude)
              const reasoning = delta?.reasoning || delta?.reasoning_content
              if (reasoning && onThinking) {
                onThinking(reasoning)
              }

              // Handle content chunks
              if (delta?.content && onChunk) {
                onChunk(delta.content)
              }

              // Handle tool calls
              if (delta?.tool_calls && onToolCalls) {
                onToolCalls(delta.tool_calls)
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
  }
}
