/**
 * Basis Builder
 *
 * Builds rich citation objects (Bases) for each claim by:
 * 1. Matching claims to available sources
 * 2. Evaluating confidence levels
 * 3. Generating reasoning explanations
 */

import type {
  Basis,
  Claim,
  SourcePosition,
  ConfidenceLevel,
  BasisBuildingResult,
  CitationModeProgress
} from './types.js'
import {
  BASIS_BUILDING_SYSTEM_PROMPT,
  getBasisBuildingPrompt,
  BATCH_ANALYSIS_SYSTEM_PROMPT,
  getBatchAnalysisPrompt
} from './prompts.js'

/**
 * Source information from the original research
 */
export interface SourceInfo {
  url: string
  title: string
  excerpt?: string
}

/**
 * Generate a unique ID for a basis
 */
function generateBasisId(): string {
  return `basis_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Build a single basis for a claim
 */
export async function buildBasisForClaim(
  claim: Claim,
  sources: SourceInfo[],
  model: string,
  apiKey: string
): Promise<Basis> {
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
        { role: 'system', content: BASIS_BUILDING_SYSTEM_PROMPT },
        { role: 'user', content: getBasisBuildingPrompt(claim.text, sources) }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to build basis: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in basis building response')
  }

  try {
    const parsed: BasisBuildingResult = JSON.parse(content)
    return createBasisFromResult(claim, parsed, sources)
  } catch (e) {
    // Return a low-confidence basis if parsing fails
    return createFallbackBasis(claim, sources)
  }
}

/**
 * Create a Basis object from the LLM result
 */
function createBasisFromResult(
  claim: Claim,
  result: BasisBuildingResult,
  availableSources: SourceInfo[]
): Basis {
  // Map sources from the result to SourcePosition objects
  const sourcePositions: SourcePosition[] = (result.sources || [])
    .map(source => {
      // Find matching source from available sources
      const matchedSource = availableSources.find(s =>
        s.url === source.url || s.title === source.title
      )

      return {
        url: source.url,
        title: source.title || matchedSource?.title || extractDomain(source.url),
        domain: extractDomain(source.url),
        startText: source.startText,
        endText: source.endText,
        excerpt: matchedSource?.excerpt
      }
    })
    .filter(s => s.url) // Remove any without URLs

  return {
    id: generateBasisId(),
    claimText: claim.text,
    claimRange: claim.range,
    confidence: validateConfidence(result.confidence),
    reasoning: result.reasoning || 'No reasoning provided',
    sources: sourcePositions
  }
}

/**
 * Create a fallback basis when LLM parsing fails
 */
function createFallbackBasis(claim: Claim, sources: SourceInfo[]): Basis {
  // Use first available source as a fallback
  const fallbackSources: SourcePosition[] = sources.slice(0, 1).map(s => ({
    url: s.url,
    title: s.title,
    domain: extractDomain(s.url),
    excerpt: s.excerpt
  }))

  return {
    id: generateBasisId(),
    claimText: claim.text,
    claimRange: claim.range,
    confidence: 'low',
    reasoning: 'Unable to analyze citation quality. Manual review recommended.',
    sources: fallbackSources
  }
}

/**
 * Validate confidence level
 */
function validateConfidence(confidence: any): ConfidenceLevel {
  if (confidence === 'high' || confidence === 'medium' || confidence === 'low') {
    return confidence
  }
  return 'low'
}

/**
 * Build bases for multiple claims in a batch (more efficient)
 */
export async function buildBasesForClaims(
  claims: Claim[],
  sources: SourceInfo[],
  model: string,
  apiKey: string,
  onProgress?: (progress: CitationModeProgress) => void,
  onBasisCreated?: (basis: Basis) => void
): Promise<Basis[]> {
  const bases: Basis[] = []

  // Process in batches of 5 for efficiency
  const batchSize = 5

  for (let i = 0; i < claims.length; i += batchSize) {
    const batch = claims.slice(i, Math.min(i + batchSize, claims.length))

    if (onProgress) {
      onProgress({
        phase: 'researching',
        currentStep: i,
        totalSteps: claims.length,
        message: `Analyzing citations ${i + 1}-${Math.min(i + batchSize, claims.length)} of ${claims.length}...`
      })
    }

    // Try batch processing first
    try {
      const batchBases = await buildBasisBatch(batch, sources, model, apiKey)

      for (const basis of batchBases) {
        bases.push(basis)
        if (onBasisCreated) {
          onBasisCreated(basis)
        }
      }
    } catch (e) {
      // Fall back to individual processing on batch failure
      console.warn('Batch processing failed, falling back to individual:', e)

      for (const claim of batch) {
        try {
          const basis = await buildBasisForClaim(claim, sources, model, apiKey)
          bases.push(basis)
          if (onBasisCreated) {
            onBasisCreated(basis)
          }
        } catch (claimError) {
          // Create fallback basis for this claim
          const fallback = createFallbackBasis(claim, sources)
          bases.push(fallback)
          if (onBasisCreated) {
            onBasisCreated(fallback)
          }
        }
      }
    }
  }

  return bases
}

/**
 * Build bases for a batch of claims in a single LLM call
 */
async function buildBasisBatch(
  claims: Claim[],
  sources: SourceInfo[],
  model: string,
  apiKey: string
): Promise<Basis[]> {
  const claimsData = claims.map(c => ({ id: c.id, text: c.text }))

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
        { role: 'system', content: BATCH_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: getBatchAnalysisPrompt(claimsData, sources) }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`Batch analysis failed: ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in batch analysis response')
  }

  const parsed = JSON.parse(content)

  if (!parsed.analyses || !Array.isArray(parsed.analyses)) {
    throw new Error('Invalid batch analysis response format')
  }

  // Map analyses back to claims and create bases
  const bases: Basis[] = []

  for (const analysis of parsed.analyses) {
    const claim = claims.find(c => c.id === analysis.claimId)
    if (!claim) continue

    const sourcePositions: SourcePosition[] = (analysis.supportingSources || [])
      .map((s: any) => {
        const matchedSource = sources.find(src => src.url === s.url)
        return {
          url: s.url,
          title: matchedSource?.title || extractDomain(s.url),
          domain: extractDomain(s.url),
          startText: s.startText,
          endText: s.endText
        }
      })
      .filter((s: SourcePosition) => s.url)

    bases.push({
      id: generateBasisId(),
      claimText: claim.text,
      claimRange: claim.range,
      confidence: validateConfidence(analysis.confidence),
      reasoning: analysis.reasoning || 'No reasoning provided',
      sources: sourcePositions
    })
  }

  return bases
}

/**
 * Re-analyze a single basis to improve its quality
 * Can be triggered by user action (e.g., "Find Better Source")
 */
export async function reanalyzeBasis(
  basis: Basis,
  sources: SourceInfo[],
  model: string,
  apiKey: string
): Promise<Basis> {
  // Create a pseudo-claim from the basis
  const claim: Claim = {
    id: basis.id,
    text: basis.claimText,
    range: basis.claimRange
  }

  // Filter out sources that were already used and had low relevance
  const filteredSources = sources.filter(s =>
    !basis.sources.some(bs => bs.url === s.url)
  )

  // If we have new sources to try, use them
  const sourcesToUse = filteredSources.length > 0
    ? filteredSources
    : sources

  return buildBasisForClaim(claim, sourcesToUse, model, apiKey)
}
