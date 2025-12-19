import type { Message, ToolCall, Source, OpenRouterChatResponse } from '../../types/index.js'
import { OpenRouterClient } from '../openrouter/client.js'
import { RESEARCH_TOOLS } from '../openrouter/tools.js'
import { executeToolCall } from './tool-executor.js'

const MAX_ITERATIONS = 5

export type ResearchQueryParams = {
  query: string
  model: string
  openrouterApiKey: string
  parallelApiKey: string
  onToolCall: (call: ToolCall) => void
  onStreamChunk: (chunk: string) => void
  onSourceAdded: (source: Source) => void
}

export async function executeResearchQuery(params: ResearchQueryParams): Promise<void> {
  const client = new OpenRouterClient(params.openrouterApiKey)

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a web research assistant. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Your training data is always outdated. ALWAYS use web search for current information. Never assume something doesn't exist based on your training.

## Tools
**search_web**: Search the web. Use the user's EXACT terms in the objective - no hedging words like "rumored" or "hypothetical", no "(or alternative)" additions.
**extract_url**: Get detailed content from URLs. Use for official docs, specs, or when search summaries lack detail.

## Strategy
- User provides URL → extract_url first
- User asks question → search_web with their exact terms
- Comparisons → separate searches for each item
- Shallow results → extract_url on promising sources or refine search
- Be proactive: include related info the user would find valuable, anticipate follow-up questions

## Rules
- Base answers ONLY on search results, not training data
- Cite sources inline: [Title](url) - no dedicated Sources section at the end
- Never claim something "doesn't exist" unless search results confirm it
- For comparisons: ensure balanced coverage of all items

Be thorough and cite sources inline throughout your response.`
    },
    {
      role: 'user',
      content: params.query
    }
  ]

  let iteration = 0

  let lastResponse: OpenRouterChatResponse | null = null

  // Phase 1 & 2: Tool calling loop (non-streaming)
  while (iteration < MAX_ITERATIONS) {
    iteration++

    const response = await client.chat({
      model: params.model,
      messages,
      tools: RESEARCH_TOOLS,
      tool_choice: 'auto',
      stream: false
    }) as OpenRouterChatResponse

    lastResponse = response
    const choice = response.choices[0]
    const finishReason = choice.finish_reason

    // If no tool calls, break out of loop
    if (finishReason !== 'tool_calls' || !choice.message.tool_calls) {
      // Don't add message yet - we'll stream it
      break
    }

    // Add assistant's tool call message to conversation
    messages.push(choice.message)

    // Execute each tool call
    const toolCalls = choice.message.tool_calls
    for (const toolCall of toolCalls) {
      // Notify UI that tool is executing
      params.onToolCall({
        ...toolCall,
        status: 'executing'
      })

      try {
        // Execute the tool call
        const result = await executeToolCall(
          toolCall,
          params.parallelApiKey,
          params.onSourceAdded
        )

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        })

        // Notify UI that tool completed
        params.onToolCall({
          ...toolCall,
          status: 'complete'
        })
      } catch (error: any) {
        // Add error as tool result
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: error.message })
        })

        // Notify UI of error
        params.onToolCall({
          ...toolCall,
          status: 'error'
        })
      }
    }
  }

  // Phase 3: Final synthesis with streaming
  // If we have a final response from the non-streaming call, stream it to the UI
  if (lastResponse && lastResponse.choices[0]?.message?.content) {
    const content = lastResponse.choices[0].message.content
    // Simulate streaming by chunking the response
    const chunkSize = 10
    for (let i = 0; i < content.length; i += chunkSize) {
      params.onStreamChunk(content.slice(i, i + chunkSize))
      await new Promise(resolve => setTimeout(resolve, 20))
    }
  } else {
    // No content in last response, make a new streaming call
    await client.chat({
      model: params.model,
      messages,
      stream: true,
      onStream: params.onStreamChunk
    })
  }
}
