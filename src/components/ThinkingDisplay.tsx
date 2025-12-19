import { useState } from 'react'

type ThinkingDisplayProps = {
  content: string
  isThinking: boolean
}

export function ThinkingDisplay({ content, isThinking }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content && !isThinking) {
    return null
  }

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className={`p-1.5 rounded-lg bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 ${isThinking ? 'animate-pulse' : ''}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {isThinking ? 'Thinking...' : 'Thinking Process'}
            </span>
            {isThinking && (
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
              </div>
            )}
          </div>
          {!isExpanded && content && (
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 truncate mt-0.5">
              {content.slice(0, 100)}...
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && content && (
        <div className="mt-2 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 max-h-96 overflow-y-auto">
          <pre className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  )
}
