/**
 * Citation Mode Hook
 *
 * Manages state and orchestrates the citation mode process.
 */

import { useReducer, useCallback } from 'react'
import type {
  CitationModeState,
  CitationModeProgress,
  Basis,
  ExtractedCitation
} from '../lib/citation-mode/types.js'
import { initialCitationModeState } from '../lib/citation-mode/types.js'
import { runCitationMode, calculateOverallConfidence, sortBasesByPosition } from '../lib/citation-mode/index.js'
import { fetchExcerpt } from '../lib/citation-mode/excerpt-fetcher.js'

// Action types
type CitationModeAction =
  | { type: 'ENABLE' }
  | { type: 'DISABLE' }
  | { type: 'START_PROCESSING'; payload: { response: string } }
  | { type: 'UPDATE_PROGRESS'; payload: CitationModeProgress }
  | { type: 'CITATIONS_STRIPPED'; payload: { stripped: string; citations: ExtractedCitation[] } }
  | { type: 'BASIS_CREATED'; payload: Basis }
  | { type: 'PROCESSING_COMPLETE'; payload: { bases: Basis[] } }
  | { type: 'PROCESSING_ERROR'; payload: string }
  | { type: 'TOGGLE_BASIS_EXPANDED'; payload: string }
  | { type: 'REMOVE_BASIS'; payload: string }
  | { type: 'UPDATE_BASIS_EXCERPT'; payload: { basisId: string; sourceUrl: string; excerpt: string } }
  | { type: 'SET_SOURCE_LOADING'; payload: { basisId: string; sourceUrl: string; loading: boolean } }
  | { type: 'RESET' }

// Reducer
function citationModeReducer(
  state: CitationModeState,
  action: CitationModeAction
): CitationModeState {
  switch (action.type) {
    case 'ENABLE':
      return { ...state, isEnabled: true }

    case 'DISABLE':
      return { ...state, isEnabled: false }

    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        originalResponse: action.payload.response,
        bases: [],
        error: undefined,
        progress: {
          phase: 'stripping',
          currentStep: 0,
          totalSteps: 4,
          message: 'Starting citation analysis...'
        }
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.payload
      }

    case 'CITATIONS_STRIPPED':
      return {
        ...state,
        strippedResponse: action.payload.stripped,
        originalCitations: action.payload.citations
      }

    case 'BASIS_CREATED':
      return {
        ...state,
        bases: [...state.bases, action.payload]
      }

    case 'PROCESSING_COMPLETE':
      return {
        ...state,
        isProcessing: false,
        bases: sortBasesByPosition(action.payload.bases),
        progress: {
          phase: 'complete',
          currentStep: 4,
          totalSteps: 4,
          message: `Enhanced ${action.payload.bases.length} citations`
        }
      }

    case 'PROCESSING_ERROR':
      return {
        ...state,
        isProcessing: false,
        error: action.payload,
        progress: {
          ...state.progress,
          phase: 'error',
          message: action.payload
        }
      }

    case 'TOGGLE_BASIS_EXPANDED':
      return {
        ...state,
        bases: state.bases.map(b =>
          b.id === action.payload
            ? { ...b, isExpanded: !b.isExpanded }
            : b
        )
      }

    case 'REMOVE_BASIS':
      return {
        ...state,
        bases: state.bases.map(b =>
          b.id === action.payload
            ? { ...b, isRemoved: true }
            : b
        )
      }

    case 'UPDATE_BASIS_EXCERPT':
      return {
        ...state,
        bases: state.bases.map(b => {
          if (b.id !== action.payload.basisId) return b
          return {
            ...b,
            sources: b.sources.map(s =>
              s.url === action.payload.sourceUrl
                ? { ...s, excerpt: action.payload.excerpt, isLoading: false }
                : s
            )
          }
        })
      }

    case 'SET_SOURCE_LOADING':
      return {
        ...state,
        bases: state.bases.map(b => {
          if (b.id !== action.payload.basisId) return b
          return {
            ...b,
            sources: b.sources.map(s =>
              s.url === action.payload.sourceUrl
                ? { ...s, isLoading: action.payload.loading }
                : s
            )
          }
        })
      }

    case 'RESET':
      return initialCitationModeState

    default:
      return state
  }
}

// Hook parameters
interface UseCitationModeParams {
  model: string
  openrouterApiKey: string
  parallelApiKey: string
}

/**
 * Hook for managing citation mode state and actions
 */
export function useCitationMode(params: UseCitationModeParams) {
  const { model, openrouterApiKey, parallelApiKey } = params

  const [state, dispatch] = useReducer(citationModeReducer, initialCitationModeState)

  /**
   * Enable citation mode
   */
  const enable = useCallback(() => {
    dispatch({ type: 'ENABLE' })
  }, [])

  /**
   * Disable citation mode
   */
  const disable = useCallback(() => {
    dispatch({ type: 'DISABLE' })
  }, [])

  /**
   * Run citation mode on a response
   */
  const analyze = useCallback(async (
    response: string,
    sources: Array<{ url: string; title: string }>
  ) => {
    if (!response || !openrouterApiKey) {
      dispatch({ type: 'PROCESSING_ERROR', payload: 'Missing response or API key' })
      return
    }

    dispatch({ type: 'START_PROCESSING', payload: { response } })

    try {
      const result = await runCitationMode({
        response,
        sources,
        model,
        openrouterApiKey,
        parallelApiKey,
        onProgress: (progress) => {
          dispatch({ type: 'UPDATE_PROGRESS', payload: progress })
        },
        onBasisCreated: (basis) => {
          dispatch({ type: 'BASIS_CREATED', payload: basis })
        },
        onError: (error) => {
          dispatch({ type: 'PROCESSING_ERROR', payload: error })
        }
      })

      dispatch({ type: 'PROCESSING_COMPLETE', payload: { bases: result.bases } })
    } catch (error: any) {
      dispatch({ type: 'PROCESSING_ERROR', payload: error.message })
    }
  }, [model, openrouterApiKey, parallelApiKey])

  /**
   * Toggle a basis expanded state
   */
  const toggleBasisExpanded = useCallback((basisId: string) => {
    dispatch({ type: 'TOGGLE_BASIS_EXPANDED', payload: basisId })
  }, [])

  /**
   * Remove a basis (soft delete)
   */
  const removeBasis = useCallback((basisId: string) => {
    dispatch({ type: 'REMOVE_BASIS', payload: basisId })
  }, [])

  /**
   * Load excerpt for a source (lazy loading)
   */
  const loadExcerpt = useCallback(async (
    basisId: string,
    sourceUrl: string,
    claimText: string
  ) => {
    // Find the source in the basis
    const basis = state.bases.find(b => b.id === basisId)
    const source = basis?.sources.find(s => s.url === sourceUrl)

    if (!source || source.excerpt || source.isLoading) {
      return // Already loaded or loading
    }

    dispatch({
      type: 'SET_SOURCE_LOADING',
      payload: { basisId, sourceUrl, loading: true }
    })

    try {
      const result = await fetchExcerpt(
        source,
        claimText,
        model,
        openrouterApiKey,
        parallelApiKey
      )

      dispatch({
        type: 'UPDATE_BASIS_EXCERPT',
        payload: { basisId, sourceUrl, excerpt: result.excerpt }
      })
    } catch (error) {
      dispatch({
        type: 'UPDATE_BASIS_EXCERPT',
        payload: { basisId, sourceUrl, excerpt: 'Failed to load excerpt' }
      })
    }
  }, [state.bases, model, openrouterApiKey, parallelApiKey])

  /**
   * Reset citation mode state
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  /**
   * Get active (non-removed) bases
   */
  const activeBases = state.bases.filter(b => !b.isRemoved)

  /**
   * Get confidence summary
   */
  const confidenceSummary = calculateOverallConfidence(activeBases)

  return {
    state,
    activeBases,
    confidenceSummary,
    enable,
    disable,
    analyze,
    toggleBasisExpanded,
    removeBasis,
    loadExcerpt,
    reset
  }
}
