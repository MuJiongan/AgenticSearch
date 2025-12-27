/**
 * Excerpt Fetcher
 *
 * Lazily loads highlighted excerpts from sources when user
 * clicks to expand a basis popover.
 */

import type { SourcePosition } from './types.js'
import { EXCERPT_EXTRACTION_SYSTEM_PROMPT, getExcerptExtractionPrompt } from './prompts.js'

/**
 * Result of fetching an excerpt
 */
export interface ExcerptFetchResult {
  excerpt: string
  confidence: 'high' | 'medium' | 'low'
  note?: string
}

/**
 * Cache for fetched excerpts to avoid redundant API calls
 */
const excerptCache = new Map<string, ExcerptFetchResult>()

/**
 * Generate a cache key for a source + claim combination
 */
function getCacheKey(sourceUrl: string, claimText: string): string {
  return `${sourceUrl}::${claimText.slice(0, 100)}`
}

/**
 * Fetch the excerpt from a source that supports a claim
 *
 * This is a two-step process:
 * 1. Extract content from the source URL
 * 2. Use LLM to find the relevant passage
 */
export async function fetchExcerpt(
  source: SourcePosition,
  claimText: string,
  model: string,
  openrouterApiKey: string,
  parallelApiKey: string
): Promise<ExcerptFetchResult> {
  const cacheKey = getCacheKey(source.url, claimText)

  // Check cache first
  if (excerptCache.has(cacheKey)) {
    return excerptCache.get(cacheKey)!
  }

  try {
    // Step 1: Extract content from the source URL
    const content = await extractSourceContent(source.url, parallelApiKey)

    if (!content) {
      return {
        excerpt: 'Unable to load content from source.',
        confidence: 'low',
        note: 'Content extraction failed'
      }
    }

    // Step 2: Use LLM to find the relevant excerpt
    const result = await findRelevantExcerpt(
      claimText,
      source.url,
      content,
      model,
      openrouterApiKey
    )

    // Cache the result
    excerptCache.set(cacheKey, result)

    return result
  } catch (error: any) {
    const errorResult: ExcerptFetchResult = {
      excerpt: 'Failed to load excerpt.',
      confidence: 'low',
      note: error.message
    }
    return errorResult
  }
}

/**
 * Extract content from a source URL using Parallel.ai
 */
async function extractSourceContent(
  url: string,
  parallelApiKey: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/parallel/v1beta/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${parallelApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        format: 'markdown',
        include_metadata: false
      })
    })

    if (!response.ok) {
      console.error('Extract API error:', response.status)
      return null
    }

    const result = await response.json()
    return result.results?.[0]?.markdown || result.results?.[0]?.content || null
  } catch (error) {
    console.error('Failed to extract content:', error)
    return null
  }
}

/**
 * Use LLM to find the relevant excerpt in the content
 */
async function findRelevantExcerpt(
  claimText: string,
  sourceUrl: string,
  content: string,
  model: string,
  apiKey: string
): Promise<ExcerptFetchResult> {
  const response = await fetch('/api/openrouter/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'AgenticSearch Citation Mode'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: EXCERPT_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: getExcerptExtractionPrompt(claimText, sourceUrl, content) }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`)
  }

  const result = await response.json()
  const responseContent = result.choices?.[0]?.message?.content

  if (!responseContent) {
    return {
      excerpt: 'No relevant excerpt found.',
      confidence: 'low'
    }
  }

  try {
    const parsed = JSON.parse(responseContent)
    return {
      excerpt: parsed.excerpt || 'No relevant excerpt found.',
      confidence: parsed.confidence || 'medium',
      note: parsed.note
    }
  } catch {
    return {
      excerpt: 'Failed to parse excerpt.',
      confidence: 'low'
    }
  }
}

/**
 * Batch fetch excerpts for multiple sources
 * More efficient for initial basis loading
 */
export async function fetchExcerptsBatch(
  sources: Array<{ source: SourcePosition; claimText: string }>,
  model: string,
  openrouterApiKey: string,
  parallelApiKey: string,
  onExcerptLoaded?: (sourceUrl: string, result: ExcerptFetchResult) => void
): Promise<Map<string, ExcerptFetchResult>> {
  const results = new Map<string, ExcerptFetchResult>()

  // Process in parallel with concurrency limit
  const concurrencyLimit = 3
  const queue = [...sources]

  const processItem = async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) break

      const result = await fetchExcerpt(
        item.source,
        item.claimText,
        model,
        openrouterApiKey,
        parallelApiKey
      )

      results.set(item.source.url, result)

      if (onExcerptLoaded) {
        onExcerptLoaded(item.source.url, result)
      }
    }
  }

  // Start concurrent workers
  const workers = Array(Math.min(concurrencyLimit, sources.length))
    .fill(null)
    .map(() => processItem())

  await Promise.all(workers)

  return results
}

/**
 * Clear the excerpt cache
 */
export function clearExcerptCache(): void {
  excerptCache.clear()
}

/**
 * Get cached excerpt if available
 */
export function getCachedExcerpt(
  sourceUrl: string,
  claimText: string
): ExcerptFetchResult | null {
  const cacheKey = getCacheKey(sourceUrl, claimText)
  return excerptCache.get(cacheKey) || null
}
