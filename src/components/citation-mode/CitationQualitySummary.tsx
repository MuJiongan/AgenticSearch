/**
 * Citation Quality Summary Component
 *
 * Shows overall citation quality metrics for the response.
 */

import type { Basis } from '../../lib/citation-mode/types.js'
import { CONFIDENCE_CONFIG } from '../../lib/citation-mode/types.js'

interface CitationQualitySummaryProps {
  bases: Basis[]
  className?: string
}

export function CitationQualitySummary({ bases, className = '' }: CitationQualitySummaryProps) {
  const activeBases = bases.filter(b => !b.isRemoved)

  if (activeBases.length === 0) {
    return null
  }

  // Calculate distribution
  const distribution = {
    high: activeBases.filter(b => b.confidence === 'high').length,
    medium: activeBases.filter(b => b.confidence === 'medium').length,
    low: activeBases.filter(b => b.confidence === 'low').length
  }

  // Calculate overall score (high=100, medium=60, low=20)
  const totalScore =
    distribution.high * 100 +
    distribution.medium * 60 +
    distribution.low * 20
  const overallScore = Math.round(totalScore / activeBases.length)

  // Determine overall quality label
  const qualityLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Fair' : 'Needs Review'
  const qualityColor = overallScore >= 80 ? CONFIDENCE_CONFIG.high.color : overallScore >= 60 ? CONFIDENCE_CONFIG.medium.color : CONFIDENCE_CONFIG.low.color

  return (
    <div className={`p-4 bg-bg-card border border-border-subtle rounded-xl ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-primary">Citation Quality</h3>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: qualityColor }}
          >
            {overallScore}%
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: `${qualityColor}20`, color: qualityColor }}
          >
            {qualityLabel}
          </span>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="h-2 bg-bg-nav rounded-full overflow-hidden flex">
        {distribution.high > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${(distribution.high / activeBases.length) * 100}%`,
              backgroundColor: CONFIDENCE_CONFIG.high.color
            }}
          />
        )}
        {distribution.medium > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${(distribution.medium / activeBases.length) * 100}%`,
              backgroundColor: CONFIDENCE_CONFIG.medium.color
            }}
          />
        )}
        {distribution.low > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${(distribution.low / activeBases.length) * 100}%`,
              backgroundColor: CONFIDENCE_CONFIG.low.color
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: CONFIDENCE_CONFIG.high.color }}
          />
          <span>High ({distribution.high})</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: CONFIDENCE_CONFIG.medium.color }}
          />
          <span>Medium ({distribution.medium})</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: CONFIDENCE_CONFIG.low.color }}
          />
          <span>Low ({distribution.low})</span>
        </div>
      </div>

      {/* Warning for low confidence citations */}
      {distribution.low > 0 && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">
            {distribution.low} citation{distribution.low > 1 ? 's' : ''} may need better sources
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Compact quality indicator for inline display
 */
export function CitationQualityBadge({ bases }: { bases: Basis[] }) {
  const activeBases = bases.filter(b => !b.isRemoved)

  if (activeBases.length === 0) {
    return null
  }

  const distribution = {
    high: activeBases.filter(b => b.confidence === 'high').length,
    medium: activeBases.filter(b => b.confidence === 'medium').length,
    low: activeBases.filter(b => b.confidence === 'low').length
  }

  const totalScore =
    distribution.high * 100 +
    distribution.medium * 60 +
    distribution.low * 20
  const overallScore = Math.round(totalScore / activeBases.length)

  const qualityColor = overallScore >= 80
    ? CONFIDENCE_CONFIG.high.color
    : overallScore >= 60
    ? CONFIDENCE_CONFIG.medium.color
    : CONFIDENCE_CONFIG.low.color

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
      style={{ backgroundColor: `${qualityColor}15`, color: qualityColor }}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      {overallScore}%
    </span>
  )
}
