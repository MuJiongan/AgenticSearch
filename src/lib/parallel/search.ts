import type { SearchResponse } from '../../types/index.js'
import type { SearchParams } from './types.js'

export async function searchWeb(params: SearchParams): Promise<SearchResponse> {
  const response = await fetch('/api/parallel/v1beta/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'parallel-beta': 'search-extract-2025-10-10'
    },
    body: JSON.stringify({
      mode: 'agentic', // Use agentic mode for token efficiency in tool calling loops
      objective: params.objective,
      search_queries: params.search_queries,
      max_results: params.max_results || 10
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Parallel Search API error: ${response.status} - ${errorText}`)
  }

  return response.json() as Promise<SearchResponse>
}
