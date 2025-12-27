/**
 * Confidence Indicator Component
 *
 * Visual display of confidence level with colored dots and label.
 */

import type { ConfidenceLevel } from '../../lib/citation-mode/types.js'
import { CONFIDENCE_CONFIG } from '../../lib/citation-mode/types.js'

interface ConfidenceIndicatorProps {
  confidence: ConfidenceLevel
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ConfidenceIndicator({
  confidence,
  showLabel = true,
  size = 'md'
}: ConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[confidence]

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const filledDots = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1
  const totalDots = 3

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalDots }).map((_, i) => (
          <span
            key={i}
            className={`${dotSizes[size]} rounded-full transition-colors`}
            style={{
              backgroundColor: i < filledDots ? config.color : 'rgba(156, 163, 175, 0.3)'
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span
          className={`font-medium ${textSizes[size]}`}
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </div>
  )
}

/**
 * Compact confidence badge for inline display
 */
export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const config = CONFIDENCE_CONFIG[confidence]

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.color
      }}
    >
      {config.label}
    </span>
  )
}
