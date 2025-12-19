type ErrorDisplayProps = {
  error: string
  onDismiss?: () => void
  onRetry?: () => void
}

export function ErrorDisplay({ error, onDismiss, onRetry }: ErrorDisplayProps) {
  return (
    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 dark:text-red-300">Error</h4>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-bold p-1 transition-colors ml-2"
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

