/**
 * Citation Mode Progress Component
 *
 * Shows detailed progress during citation mode processing.
 */

import type { CitationModeProgress as Progress } from '../../lib/citation-mode/types.js'

interface CitationModeProgressProps {
  progress: Progress
  basesCreated?: number
}

export function CitationModeProgress({ progress, basesCreated = 0 }: CitationModeProgressProps) {
  const phases = [
    { key: 'stripping', label: 'Analyzing Citations', icon: '📋' },
    { key: 'analyzing', label: 'Identifying Claims', icon: '🔍' },
    { key: 'researching', label: 'Building Bases', icon: '🔬' },
    { key: 'complete', label: 'Complete', icon: '✅' }
  ]

  const currentPhaseIndex = phases.findIndex(p => p.key === progress.phase)

  return (
    <div className="p-4 bg-bg-card border border-border-subtle rounded-xl">
      {/* Phase indicators */}
      <div className="flex items-center justify-between mb-4">
        {phases.map((phase, index) => {
          const isActive = index === currentPhaseIndex
          const isComplete = index < currentPhaseIndex

          return (
            <div
              key={phase.key}
              className={`flex items-center ${index < phases.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : isComplete
                    ? 'bg-brand-primary/20 text-brand-primary'
                    : 'bg-bg-nav text-text-secondary'
                }`}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{phase.icon}</span>
                )}
              </div>
              {index < phases.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    isComplete ? 'bg-brand-primary' : 'bg-border-subtle'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current phase info */}
      <div className="text-center mb-3">
        <p className="text-sm font-medium text-text-primary">
          {phases[currentPhaseIndex]?.label || 'Processing'}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          {progress.message}
        </p>
      </div>

      {/* Progress bar */}
      {progress.totalSteps > 0 && (
        <div className="h-2 bg-bg-nav rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all duration-300 ease-out"
            style={{
              width: `${Math.min((progress.currentStep / progress.totalSteps) * 100, 100)}%`
            }}
          />
        </div>
      )}

      {/* Stats */}
      {basesCreated > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-brand-primary rounded-full" />
            {basesCreated} citations enhanced
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Inline progress indicator (for header/toolbar)
 */
export function CitationModeProgressInline({ progress }: { progress: Progress }) {
  if (progress.phase === 'complete' || progress.phase === 'idle') {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <svg className="w-4 h-4 animate-spin text-brand-primary" fill="none" viewBox="0 0 24 24">
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
      <span>{progress.message}</span>
    </div>
  )
}
