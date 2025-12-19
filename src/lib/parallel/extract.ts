import type { ExtractResponse } from '../../types/index.js'
import type { ExtractParams } from './types.js'

export async function extractUrls(params: ExtractParams): Promise<ExtractResponse> {
  const response = await fetch('/api/parallel/v1beta/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'parallel-beta': 'search-extract-2025-10-10'
    },
    body: JSON.stringify({
      urls: params.urls,
      objective: params.objective,
      excerpts: params.excerpts ?? true,
      full_content: params.full_content ?? false
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Parallel Extract API error: ${response.status} - ${errorText}`)
  }

  return response.json() as Promise<ExtractResponse>
}
