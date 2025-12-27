/**
 * Basis Badge Component
 *
 * The colored dot/badge that appears inline in the text.
 * Click to expand the basis popover.
 */

import { useState, useRef, useEffect } from 'react'
import type { Basis } from '../../lib/citation-mode/types.js'
import { CONFIDENCE_CONFIG } from '../../lib/citation-mode/types.js'
import { BasisPopover } from './BasisPopover.js'

interface BasisBadgeProps {
  basis: Basis
  index: number
  onRemove: () => void
  onLoadExcerpt: (sourceUrl: string) => void
}

export function BasisBadge({
  basis,
  index,
  onRemove,
  onLoadExcerpt
}: BasisBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<'above' | 'below'>('below')
  const badgeRef = useRef<HTMLButtonElement>(null)

  // Determine popover position based on viewport
  useEffect(() => {
    if (isExpanded && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      // If less than 300px below, show above
      setPopoverPosition(spaceBelow < 350 && spaceAbove > spaceBelow ? 'above' : 'below')
    }
  }, [isExpanded])

  const config = CONFIDENCE_CONFIG[basis.confidence]

  if (basis.isRemoved) {
    return null
  }

  return (
    <span className="relative inline-block">
      <button
        ref={badgeRef}
        onClick={() => setIsExpanded(!isExpanded)}
        className="basis-badge inline-flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary/50"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
          minWidth: '16px',
          height: '16px',
          padding: '0 3px',
          fontSize: '10px',
          fontWeight: 700,
          borderRadius: '3px',
          verticalAlign: 'super',
          marginLeft: '1px',
          marginRight: '1px',
          cursor: 'pointer',
          border: `1px solid ${config.color}33`
        }}
        title={`${config.label} confidence - Click for details`}
        aria-expanded={isExpanded}
        aria-label={`Citation ${index + 1}: ${basis.claimText.slice(0, 50)}...`}
      >
        {index + 1}
      </button>

      {isExpanded && (
        <BasisPopover
          basis={basis}
          onClose={() => setIsExpanded(false)}
          onRemove={() => {
            onRemove()
            setIsExpanded(false)
          }}
          onLoadExcerpt={onLoadExcerpt}
          position={popoverPosition}
        />
      )}
    </span>
  )
}

/**
 * Simple colored dot indicator (for inline use without number)
 */
export function BasisDot({ confidence }: { confidence: Basis['confidence'] }) {
  const config = CONFIDENCE_CONFIG[confidence]

  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: config.color }}
      title={`${config.label} confidence`}
    />
  )
}
