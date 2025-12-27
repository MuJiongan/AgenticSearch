/**
 * Citation Mode Types
 *
 * The "Basis" system replaces simple inline citations with rich citation objects
 * that include confidence scores, reasoning, and lazy-loaded source excerpts.
 */

// Confidence levels for citations
export type ConfidenceLevel = 'low' | 'medium' | 'high'

// Confidence level metadata
export const CONFIDENCE_CONFIG = {
  high: {
    color: '#3B82F6',     // Blue
    bgColor: 'rgba(59, 130, 246, 0.1)',
    label: 'High',
    description: 'Primary source with direct evidence'
  },
  medium: {
    color: '#F59E0B',     // Amber
    bgColor: 'rgba(245, 158, 11, 0.1)',
    label: 'Medium',
    description: 'Secondary source or indirect evidence'
  },
  low: {
    color: '#EF4444',     // Red
    bgColor: 'rgba(239, 68, 68, 0.1)',
    label: 'Low',
    description: 'Weak support or tangentially related'
  }
} as const

/**
 * Position reference for lazy-loading highlights from sources
 */
export interface SourcePosition {
  url: string
  title: string
  domain: string

  // For lazy loading excerpts
  startText?: string      // Beginning text marker
  endText?: string        // End text marker

  // Cached excerpt after fetch
  excerpt?: string
  fetchedAt?: number
  isLoading?: boolean
  fetchError?: string
}

/**
 * A claim identified in the response that needs citation support
 */
export interface Claim {
  id: string
  text: string
  range: {
    start: number
    end: number
  }
}

/**
 * The "Basis" - a rich citation object that replaces simple [1] style citations
 */
export interface Basis {
  id: string

  // What this basis supports
  claimText: string
  claimRange: {
    start: number
    end: number
  }

  // Quality metadata
  confidence: ConfidenceLevel
  reasoning: string           // 1-3 sentences explaining why

  // Supporting sources (multiple allowed)
  sources: SourcePosition[]

  // UI state
  isExpanded?: boolean
  isRemoved?: boolean
}

/**
 * Original citation extracted from response (to be replaced)
 */
export interface ExtractedCitation {
  index: number              // The [1], [2] number
  url: string
  title: string
  fullMatch: string          // The full markdown link [title](url)
  position: number           // Character position in original text
}

/**
 * Processing phases for citation mode
 */
export type CitationModePhase =
  | 'idle'
  | 'stripping'              // Removing original citations
  | 'analyzing'              // Identifying claims
  | 'researching'            // Building bases with tool calls
  | 'complete'
  | 'error'

/**
 * Progress tracking for citation mode processing
 */
export interface CitationModeProgress {
  phase: CitationModePhase
  currentStep: number
  totalSteps: number
  message: string
}

/**
 * Main state for citation mode
 */
export interface CitationModeState {
  isEnabled: boolean
  isProcessing: boolean

  // Original response preserved
  originalResponse: string
  originalCitations: ExtractedCitation[]

  // Processed response
  strippedResponse: string    // Text with [1][2] removed
  bases: Basis[]

  // Processing progress
  progress: CitationModeProgress

  // Error state
  error?: string
}

/**
 * Initial state for citation mode
 */
export const initialCitationModeState: CitationModeState = {
  isEnabled: false,
  isProcessing: false,
  originalResponse: '',
  originalCitations: [],
  strippedResponse: '',
  bases: [],
  progress: {
    phase: 'idle',
    currentStep: 0,
    totalSteps: 0,
    message: ''
  }
}

/**
 * Result from the claim extraction LLM call
 */
export interface ClaimExtractionResult {
  claims: Claim[]
}

/**
 * Result from the basis building LLM call
 */
export interface BasisBuildingResult {
  confidence: ConfidenceLevel
  reasoning: string
  sources: Array<{
    url: string
    title: string
    relevance: 'high' | 'medium' | 'low'
    startText?: string
    endText?: string
  }>
  needsMoreResearch: boolean
  suggestedQuery?: string
}

/**
 * Parameters for running citation mode
 */
export interface CitationModeParams {
  response: string
  sources: Array<{ url: string; title: string }>
  model: string
  openrouterApiKey: string
  parallelApiKey: string
  onProgress: (progress: CitationModeProgress) => void
  onBasisCreated: (basis: Basis) => void
  onError: (error: string) => void
}
