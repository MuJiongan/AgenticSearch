import type { Tool } from '../../types/index.js'

export const RESEARCH_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information related to the user's query. Use this when you need to find recent information, facts, or multiple sources about a topic.",
      parameters: {
        type: "object",
        properties: {
          objective: {
            type: "string",
            description: "A clear description of what information you're looking for"
          },
          search_queries: {
            type: "array",
            items: { type: "string" },
            description: "Optional: specific search queries to use. If not provided, Parallel will generate them from the objective."
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return (default: 10)"
          }
        },
        required: ["objective"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "extract_url",
      description: "Extract detailed content from specific URLs. Use this when you have identified relevant URLs from search results and need their full content.",
      parameters: {
        type: "object",
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "List of URLs to extract content from"
          },
          objective: {
            type: "string",
            description: "What specific information you want to extract from these URLs"
          },
          excerpts: {
            type: "boolean",
            description: "Whether to get excerpts (true) or full content (false). Default: true"
          }
        },
        required: ["urls", "objective"]
      }
    }
  }
]

export const MODELS: Array<{ id: string, name: string, provider: string }> = [
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'anthropic' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3.0 Flash', provider: 'google' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3.0 Pro', provider: 'google' },
  { id: 'openai/gpt-5.2', name: 'GPT 5.2', provider: 'openai' }
]
