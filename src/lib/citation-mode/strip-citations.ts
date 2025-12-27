/**
 * Citation Stripping Utility
 *
 * Extracts and removes original [title](url) style citations from the response text,
 * preparing it for the Basis system replacement.
 */

import type { ExtractedCitation } from './types.js'

/**
 * Result of stripping citations from text
 */
export interface StripCitationsResult {
  strippedText: string
  citations: ExtractedCitation[]
  // Map of original positions to stripped positions (for basis placement)
  positionMap: Map<number, number>
}

/**
 * Regex to match markdown links: [text](url)
 * Captures: full match, link text, URL
 */
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g

/**
 * Check if a URL looks like a citation (http/https URL)
 */
function isCitationUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}


/**
 * Strip markdown link citations from text and extract them for processing
 *
 * @param text - The response text containing markdown citations
 * @returns Object with stripped text, extracted citations, and position mapping
 */
export function stripCitations(text: string): StripCitationsResult {
  const citations: ExtractedCitation[] = []
  const positionMap = new Map<number, number>()

  let citationIndex = 0

  // Find all markdown links and extract citations
  const matches = Array.from(text.matchAll(MARKDOWN_LINK_REGEX))

  for (const match of matches) {
    const fullMatch = match[0]
    const linkText = match[1]
    const url = match[2]
    const position = match.index!

    // Only process if it's a valid citation URL
    if (isCitationUrl(url)) {
      citations.push({
        index: citationIndex++,
        url,
        title: linkText,
        fullMatch,
        position
      })
    }
  }

  // Now strip the citations from the text
  // We replace [text](url) with just the inline badge placeholder
  let strippedText = text
  let currentOffset = 0

  for (const citation of citations) {
    const originalPosition = citation.position
    const adjustedPosition = originalPosition - currentOffset

    // Store the position mapping (original -> stripped)
    positionMap.set(originalPosition, adjustedPosition)

    // Remove the markdown link, leaving nothing (basis badge will be inserted by UI)
    const before = strippedText.slice(0, adjustedPosition)
    const after = strippedText.slice(adjustedPosition + citation.fullMatch.length)

    strippedText = before + after
    currentOffset += citation.fullMatch.length
  }

  return {
    strippedText,
    citations,
    positionMap
  }
}

/**
 * Alternative: Strip citations but keep the link text (for readability)
 * This keeps the claimed text but removes the URL part
 */
export function stripCitationsKeepText(text: string): StripCitationsResult {
  const citations: ExtractedCitation[] = []
  const positionMap = new Map<number, number>()

  let citationIndex = 0

  // Find all markdown links
  const matches = Array.from(text.matchAll(MARKDOWN_LINK_REGEX))

  for (const match of matches) {
    const fullMatch = match[0]
    const linkText = match[1]
    const url = match[2]
    const position = match.index!

    if (isCitationUrl(url)) {
      citations.push({
        index: citationIndex++,
        url,
        title: linkText,
        fullMatch,
        position
      })
    }
  }

  // Replace [text](url) with just text
  let strippedText = text
  let currentOffset = 0

  for (const citation of citations) {
    const originalPosition = citation.position
    const adjustedPosition = originalPosition - currentOffset

    // Store position mapping
    positionMap.set(originalPosition, adjustedPosition)

    // Replace with just the link text
    const before = strippedText.slice(0, adjustedPosition)
    const after = strippedText.slice(adjustedPosition + citation.fullMatch.length)

    strippedText = before + citation.title + after

    // Update offset: we removed fullMatch.length and added title.length
    currentOffset += citation.fullMatch.length - citation.title.length
  }

  return {
    strippedText,
    citations,
    positionMap
  }
}

/**
 * Find the claim text that a citation was supporting
 * Looks backwards from the citation position to find the sentence/phrase
 */
export function findClaimForCitation(
  text: string,
  citationPosition: number,
  maxLength: number = 200
): string {
  // Look backwards to find sentence start (. ! ? or start of text)
  let sentenceStart = citationPosition
  const sentenceEndChars = ['.', '!', '?', '\n']

  for (let i = citationPosition - 1; i >= 0 && citationPosition - i < maxLength; i--) {
    if (sentenceEndChars.includes(text[i])) {
      sentenceStart = i + 1
      break
    }
    if (i === 0) {
      sentenceStart = 0
    }
  }

  // Extract the claim text (from sentence start to citation position)
  let claim = text.slice(sentenceStart, citationPosition).trim()

  // Remove leading whitespace and punctuation
  claim = claim.replace(/^[\s,;:]+/, '')

  return claim
}

/**
 * Group citations by the claim they support
 * Multiple citations might support the same claim (e.g., [Source 1](url1) [Source 2](url2))
 */
export function groupCitationsByClaim(
  text: string,
  citations: ExtractedCitation[]
): Map<string, ExtractedCitation[]> {
  const groups = new Map<string, ExtractedCitation[]>()

  // Sort citations by position
  const sorted = [...citations].sort((a, b) => a.position - b.position)

  for (const citation of sorted) {
    const claim = findClaimForCitation(text, citation.position)

    if (!groups.has(claim)) {
      groups.set(claim, [])
    }
    groups.get(claim)!.push(citation)
  }

  return groups
}
