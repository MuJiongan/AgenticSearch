/**
 * Claim Extractor
 *
 * Uses LLM to identify factual claims in the response text
 * that need citation support.
 */

import type { Claim, ClaimExtractionResult } from './types.js'
import { CLAIM_EXTRACTION_SYSTEM_PROMPT, getClaimExtractionPrompt } from './prompts.js'

/**
 * Extract claims from response text using LLM
 */
export async function extractClaims(
  responseText: string,
  model: string,
  apiKey: string
): Promise<ClaimExtractionResult> {
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
        { role: 'system', content: CLAIM_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: getClaimExtractionPrompt(responseText) }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to extract claims: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in claim extraction response')
  }

  try {
    const parsed = JSON.parse(content)
    return validateClaimExtractionResult(parsed, responseText)
  } catch (e) {
    throw new Error(`Failed to parse claim extraction response: ${e}`)
  }
}

/**
 * Validate and fix claim extraction result
 * Ensures positions are accurate and claims are valid
 */
function validateClaimExtractionResult(
  result: any,
  originalText: string
): ClaimExtractionResult {
  if (!result.claims || !Array.isArray(result.claims)) {
    return { claims: [] }
  }

  const validClaims: Claim[] = []

  for (const claim of result.claims) {
    // Validate required fields
    if (!claim.text || typeof claim.start !== 'number' || typeof claim.end !== 'number') {
      continue
    }

    // Validate positions are within bounds
    if (claim.start < 0 || claim.end > originalText.length || claim.start >= claim.end) {
      // Try to find the claim text in the original
      const foundIndex = originalText.indexOf(claim.text)
      if (foundIndex !== -1) {
        claim.start = foundIndex
        claim.end = foundIndex + claim.text.length
      } else {
        // Skip this claim if we can't find it
        continue
      }
    }

    // Verify the text matches
    const extractedText = originalText.slice(claim.start, claim.end)
    if (extractedText !== claim.text) {
      // Try to find and fix
      const foundIndex = originalText.indexOf(claim.text)
      if (foundIndex !== -1) {
        claim.start = foundIndex
        claim.end = foundIndex + claim.text.length
      } else {
        // Use fuzzy matching as last resort
        const fuzzyMatch = findFuzzyMatch(originalText, claim.text)
        if (fuzzyMatch) {
          claim.start = fuzzyMatch.start
          claim.end = fuzzyMatch.end
          claim.text = fuzzyMatch.text
        } else {
          continue
        }
      }
    }

    validClaims.push({
      id: claim.id || `claim_${validClaims.length + 1}`,
      text: claim.text,
      range: {
        start: claim.start,
        end: claim.end
      }
    })
  }

  return { claims: validClaims }
}

/**
 * Find a fuzzy match for claim text in the original
 * Handles minor differences like whitespace or punctuation
 */
function findFuzzyMatch(
  text: string,
  searchText: string
): { start: number; end: number; text: string } | null {
  // Normalize both texts for comparison
  const normalizedSearch = searchText.toLowerCase().replace(/\s+/g, ' ').trim()

  // Sliding window approach
  const words = normalizedSearch.split(' ')
  const minWords = Math.max(1, words.length - 2)

  // Try progressively smaller substrings
  for (let windowSize = words.length; windowSize >= minWords; windowSize--) {
    const searchSubstring = words.slice(0, windowSize).join(' ')

    for (let i = 0; i <= text.length - searchSubstring.length; i++) {
      const candidate = text.slice(i, i + searchSubstring.length + 50)
      const normalizedCandidate = candidate.toLowerCase().replace(/\s+/g, ' ')

      if (normalizedCandidate.startsWith(searchSubstring)) {
        // Found a match, extract the actual text
        const endIndex = i + Math.min(searchText.length + 20, candidate.length)
        const actualText = text.slice(i, endIndex).split(/[.!?\n]/)[0]

        if (actualText.length >= searchSubstring.length) {
          return {
            start: i,
            end: i + actualText.length,
            text: actualText
          }
        }
      }
    }
  }

  return null
}

/**
 * Merge overlapping or adjacent claims
 */
export function mergeClaims(claims: Claim[]): Claim[] {
  if (claims.length <= 1) return claims

  // Sort by start position
  const sorted = [...claims].sort((a, b) => a.range.start - b.range.start)
  const merged: Claim[] = []

  let current = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]

    // Check if claims overlap or are very close (within 10 chars)
    if (next.range.start <= current.range.end + 10) {
      // Merge: extend current to include next
      current = {
        id: current.id,
        text: current.text, // Keep the first claim's text as representative
        range: {
          start: current.range.start,
          end: Math.max(current.range.end, next.range.end)
        }
      }
    } else {
      merged.push(current)
      current = next
    }
  }

  merged.push(current)
  return merged
}

/**
 * Filter out claims that are too short or likely not factual
 */
export function filterClaims(claims: Claim[], minLength: number = 10): Claim[] {
  return claims.filter(claim => {
    // Must be at least minLength characters
    if (claim.text.length < minLength) return false

    // Must contain at least one word character
    if (!/\w/.test(claim.text)) return false

    // Skip claims that are just numbers or dates
    if (/^\d+$/.test(claim.text.trim())) return false

    return true
  })
}
