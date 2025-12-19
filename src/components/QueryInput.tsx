import { useState } from 'react'

type QueryInputProps = {
  onSubmit: (query: string) => void
  disabled?: boolean
}

export function QueryInput({ onSubmit, disabled }: QueryInputProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !disabled) {
      onSubmit(query)
      setQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="flex items-end gap-2 p-2 min-h-[56px]">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 max-h-48 px-4 py-3 bg-transparent border-none focus:ring-0 text-lg resize-none disabled:cursor-not-allowed placeholder:text-text-secondary/50 text-text-primary"
          style={{ height: 'auto', minHeight: '44px' }}
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${query.trim()
            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-110 active:scale-95'
            : 'text-text-secondary opacity-30 cursor-not-allowed'
            }`}
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 rotate-45 -translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>


      </div>
    </form>
  )
}
