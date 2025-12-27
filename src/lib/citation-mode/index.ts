/**
 * Citation Mode - Main Module
 *
 * Orchestrates the citation mode process:
 * 1. Strip original citations
 * 2. Extract claims
 * 3. Build bases
 * 4. Return enhanced response
 */

export * from './types.js'
export * from './strip-citations.js'
export * from './claim-extractor.js'
export * from './basis-builder.js'
export * from './excerpt-fetcher.js'
export * from './prompts.js'

import type {
  Basis,
  CitationModeParams,
  ExtractedCitation
} from './types.js'
import { stripCitationsKeepText } from './strip-citations.js'
import { extractClaims, filterClaims, mergeClaims } from './claim-extractor.js'
import { buildBasesForClaims, type SourceInfo } from './basis-builder.js'

/**
 * Result of running citation mode
 */
export interface CitationModeResult {
  originalResponse: string
  strippedResponse: string
  originalCitations: ExtractedCitation[]
  bases: Basis[]
}

/**
 * Run the complete citation mode process
 */
export async function runCitationMode(
  params: CitationModeParams
): Promise<CitationModeResult> {
  const {
    response,
    sources,
    model,
    openrouterApiKey,
    // parallelApiKey is available for future use with excerpt fetching
    onProgress,
    onBasisCreated,
    onError
  } = params

  try {
    // Phase 1: Strip original citations
    onProgress({
      phase: 'stripping',
      currentStep: 0,
      totalSteps: 4,
      message: 'Analyzing existing citations...'
    })

    const { strippedText, citations } = stripCitationsKeepText(response)

    // Phase 2: Extract claims
    onProgress({
      phase: 'analyzing',
      currentStep: 1,
      totalSteps: 4,
      message: 'Identifying factual claims...'
    })

    const { claims: rawClaims } = await extractClaims(strippedText, model, openrouterApiKey)

    // Filter and merge claims
    const filteredClaims = filterClaims(rawClaims)
    const mergedClaims = mergeClaims(filteredClaims)

    onProgress({
      phase: 'analyzing',
      currentStep: 2,
      totalSteps: 4,
      message: `Found ${mergedClaims.length} claims to verify...`
    })

    // Phase 3: Build bases for each claim
    const sourceInfos: SourceInfo[] = sources.map(s => ({
      url: s.url,
      title: s.title
    }))

    const bases = await buildBasesForClaims(
      mergedClaims,
      sourceInfos,
      model,
      openrouterApiKey,
      onProgress,
      onBasisCreated
    )

    // Phase 4: Complete
    onProgress({
      phase: 'complete',
      currentStep: 4,
      totalSteps: 4,
      message: `Enhanced ${bases.length} citations`
    })

    return {
      originalResponse: response,
      strippedResponse: strippedText,
      originalCitations: citations,
      bases
    }
  } catch (error: any) {
    onError(error.message || 'Citation mode failed')
    throw error
  }
}

/**
 * Calculate overall confidence score for the response
 */
export function calculateOverallConfidence(bases: Basis[]): {
  score: number
  distribution: { high: number; medium: number; low: number }
} {
  if (bases.length === 0) {
    return { score: 0, distribution: { high: 0, medium: 0, low: 0 } }
  }

  const distribution = { high: 0, medium: 0, low: 0 }

  for (const basis of bases) {
    distribution[basis.confidence]++
  }

  // Calculate weighted score (high=100, medium=60, low=20)
  const totalScore =
    distribution.high * 100 +
    distribution.medium * 60 +
    distribution.low * 20

  const score = Math.round(totalScore / bases.length)

  return { score, distribution }
}

/**
 * Get bases that need attention (low confidence or no sources)
 */
export function getBasesNeedingAttention(bases: Basis[]): Basis[] {
  return bases.filter(
    basis => basis.confidence === 'low' || basis.sources.length === 0
  )
}

/**
 * Sort bases by position in the response
 */
export function sortBasesByPosition(bases: Basis[]): Basis[] {
  return [...bases].sort((a, b) => a.claimRange.start - b.claimRange.start)
}
