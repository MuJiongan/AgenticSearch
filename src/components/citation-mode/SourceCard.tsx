/**
 * Source Card Component
 *
 * Displays a single source in the basis popover with:
 * - Favicon and domain
 * - Title
 * - Lazy-loaded excerpt
 */

import { useState } from 'react'
import type { SourcePosition } from '../../lib/citation-mode/types.js'

interface SourceCardProps {
  source: SourcePosition
  claimText: string
  onLoadExcerpt: () => void
}

export function SourceCard({ source, onLoadExcerpt }: SourceCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleLoadExcerpt = () => {
    if (!source.excerpt && !source.isLoading) {
      onLoadExcerpt()
    }
  }

  return (
    <div
      className="rounded-lg border border-border-subtle bg-bg-main/50 overflow-hidden transition-all hover:border-brand-primary/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2.5 hover:bg-brand-primary/5 transition-colors"
      >
        <img
          src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
          alt=""
          className="w-4 h-4 rounded-sm flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {source.title}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {source.domain}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-text-secondary transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>

      {/* Excerpt section */}
      <div className="border-t border-border-subtle">
        {source.isLoading ? (
          <div className="p-2.5 flex items-center gap-2 text-text-secondary">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <span className="text-xs">Loading excerpt...</span>
          </div>
        ) : source.excerpt ? (
          <div className="p-2.5">
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-4 italic">
              "{source.excerpt}"
            </p>
          </div>
        ) : (
          <button
            onClick={handleLoadExcerpt}
            className="w-full p-2.5 flex items-center justify-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Load excerpt</span>
          </button>
        )}
      </div>
    </div>
  )
}
