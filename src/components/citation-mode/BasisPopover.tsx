/**
 * Basis Popover Component
 *
 * Expanded view showing:
 * - Claim text
 * - Confidence indicator
 * - Reasoning explanation
 * - Source cards with lazy-loaded excerpts
 */

import { useEffect, useRef } from 'react'
import type { Basis } from '../../lib/citation-mode/types.js'
import { ConfidenceIndicator } from './ConfidenceIndicator.js'
import { SourceCard } from './SourceCard.js'

interface BasisPopoverProps {
  basis: Basis
  onClose: () => void
  onRemove: () => void
  onLoadExcerpt: (sourceUrl: string) => void
  position?: 'above' | 'below'
}

export function BasisPopover({
  basis,
  onClose,
  onRemove,
  onLoadExcerpt,
  position = 'below'
}: BasisPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const positionClasses = position === 'above'
    ? 'bottom-full mb-2'
    : 'top-full mt-2'

  return (
    <div
      ref={popoverRef}
      className={`absolute left-1/2 -translate-x-1/2 ${positionClasses} z-50 w-80 max-w-[calc(100vw-2rem)]`}
    >
      <div className="bg-bg-card backdrop-blur-xl border border-border-subtle rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-3 border-b border-border-subtle bg-bg-nav/50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Claim
            </p>
            <button
              onClick={onClose}
              className="p-1 -m-1 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-primary font-medium leading-snug">
            "{basis.claimText}"
          </p>
        </div>

        {/* Confidence */}
        <div className="p-3 border-b border-border-subtle">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Confidence
          </p>
          <ConfidenceIndicator confidence={basis.confidence} size="md" />
        </div>

        {/* Reasoning */}
        <div className="p-3 border-b border-border-subtle">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Why This Source
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {basis.reasoning}
          </p>
        </div>

        {/* Sources */}
        <div className="p-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Sources ({basis.sources.length})
          </p>
          <div className="space-y-2">
            {basis.sources.map((source, index) => (
              <SourceCard
                key={source.url || index}
                source={source}
                claimText={basis.claimText}
                onLoadExcerpt={() => onLoadExcerpt(source.url)}
              />
            ))}
            {basis.sources.length === 0 && (
              <p className="text-sm text-text-secondary italic">
                No sources found for this claim.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-border-subtle bg-bg-nav/30">
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}
