/**
 * Citation Mode Toggle Component
 *
 * Button to enable/trigger citation mode analysis.
 */

import type { CitationModeProgress } from '../../lib/citation-mode/types.js'

interface CitationModeToggleProps {
  isEnabled: boolean
  isProcessing: boolean
  progress?: CitationModeProgress
  onToggle: () => void
  onAnalyze: () => void
  disabled?: boolean
}

export function CitationModeToggle({
  isEnabled,
  isProcessing,
  progress,
  onToggle,
  onAnalyze,
  disabled = false
}: CitationModeToggleProps) {
  if (isProcessing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
        <svg className="w-4 h-4 text-brand-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-primary">
            {progress?.message || 'Processing...'}
          </p>
          {progress && progress.totalSteps > 0 && (
            <div className="mt-1 h-1 bg-brand-primary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all duration-300"
                style={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isEnabled) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Citation Mode Active</span>
        </button>
        <button
          onClick={onToggle}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-nav rounded-lg transition-colors"
          title="Exit Citation Mode"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onAnalyze}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-brand-primary bg-bg-nav hover:bg-brand-primary/10 border border-border-subtle hover:border-brand-primary/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Enhance citations with confidence scores and reasoning"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span>Enhance Citations</span>
    </button>
  )
}

/**
 * Compact toggle for mobile or sidebar
 */
export function CitationModeToggleCompact({
  isEnabled,
  isProcessing,
  onToggle,
  onAnalyze,
  disabled = false
}: Omit<CitationModeToggleProps, 'progress'>) {
  if (isProcessing) {
    return (
      <button
        disabled
        className="p-2 text-brand-primary bg-brand-primary/10 rounded-lg"
        title="Processing..."
      >
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={isEnabled ? onToggle : onAnalyze}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        isEnabled
          ? 'text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20'
          : 'text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isEnabled ? 'Exit Citation Mode' : 'Enhance Citations'}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </button>
  )
}
