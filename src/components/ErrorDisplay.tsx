type ErrorDisplayProps = {
  error: string
  onDismiss?: () => void
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-300">Error</h4>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-bold p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

