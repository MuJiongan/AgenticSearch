import { useState, useEffect, useRef, useMemo } from 'react'
import { useOpenRouterModels, type CustomModel, type OpenRouterModel } from '../hooks/useOpenRouterModels.js'

type ModelSelectorProps = {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
  apiKey: string
}

export function ModelSelector({ value, onChange, disabled, apiKey }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [hasFetched, setHasFetched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    allModels,
    customModels,
    loading,
    error,
    fetchModels,
    addCustomModel,
    removeCustomModel
  } = useOpenRouterModels(apiKey)

  // Combine all models: custom (saved) + OpenRouter (fetched)
  const allSelectableModels = useMemo(() => {
    const customModelsList = customModels.map((cm: CustomModel) => ({
      ...cm,
      provider: cm.id.split('/')[0] || 'custom',
      source: 'custom' as const
    }))

    const openRouterModels = allModels
      .filter((m: OpenRouterModel) => !customModels.some((cm: CustomModel) => cm.id === m.id))
      .map((m: OpenRouterModel) => ({
        id: m.id,
        name: m.name,
        provider: m.id.split('/')[0],
        source: 'openrouter' as const
      }))

    return [...customModelsList, ...openRouterModels]
  }, [allModels, customModels])

  // Filter models based on search - supports multi-word queries
  const filteredModels = useMemo(() => {
    if (!search.trim()) return allSelectableModels.slice(0, 20)

    // Split search into words and match each independently
    const queryWords = search.toLowerCase().split(/\s+/).filter(w => w.length > 0)

    return allSelectableModels
      .filter(m => {
        const searchText = `${m.id} ${m.name}`.toLowerCase()
        // All query words must be found somewhere in the model id or name
        return queryWords.every(word => searchText.includes(word))
      })
      .slice(0, 50)
  }, [allSelectableModels, search])

  // Get current model display name
  const currentModel = allSelectableModels.find(m => m.id === value) || { name: value.split('/').pop() || value }

  // Fetch models when dropdown opens (once)
  useEffect(() => {
    if (isOpen && !hasFetched && apiKey) {
      setHasFetched(true)
      fetchModels()
    }
  }, [isOpen, hasFetched, apiKey, fetchModels])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (modelId: string, modelName: string) => {
    // Add to custom models if not already saved
    const isAlreadySaved = customModels.some((cm: CustomModel) => cm.id === modelId)

    if (!isAlreadySaved) {
      addCustomModel({ id: modelId, name: modelName })
    }

    onChange(modelId)
    setIsOpen(false)
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearch('')
    } else if (e.key === 'Enter' && filteredModels.length > 0) {
      handleSelect(filteredModels[0].id, filteredModels[0].name)
    }
  }

  return (
    <div className="px-4 py-3 border-b border-border-subtle bg-transparent relative" ref={dropdownRef}>
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-text-secondary/60">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wide leading-none">Model</span>
        </div>

        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-brand-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-main disabled:opacity-50"
        >
          <span className="truncate max-w-[200px] sm:max-w-[300px]">{currentModel.name}</span>
          <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-subtle rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border-subtle">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search models or paste model ID..."
              className="w-full px-3 py-2 bg-bg-main border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center text-text-secondary text-sm">
              <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              Loading models...
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 text-center text-sm">
              <div className="text-rose-400 mb-2">{error}</div>
              <button
                onClick={fetchModels}
                className="text-brand-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Model List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredModels.length === 0 && !loading && (
              <div className="p-4 text-center text-text-secondary text-sm">
                {search.trim() ? (
                  <button
                    onClick={() => handleSelect(search.trim(), search.trim().split('/').pop() || search.trim())}
                    className="text-brand-primary hover:underline"
                  >
                    Use "{search.trim()}" as model ID
                  </button>
                ) : (
                  apiKey ? 'Type to search models' : 'Add OpenRouter API key to browse models'
                )}
              </div>
            )}

            {filteredModels.map((model) => {
              const isSelected = model.id === value
              const isSaved = model.source === 'custom'

              return (
                <div
                  key={model.id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${isSelected
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'hover:bg-bg-main text-text-primary'
                    }`}
                  onClick={() => handleSelect(model.id, model.name)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {model.name}
                      {isSaved && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded">
                          saved
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary truncate">{model.id}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {isSaved && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCustomModel(model.id)
                        }}
                        className="p-1 text-text-secondary hover:text-rose-400 transition-colors"
                        title="Remove from saved models"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {isSelected && (
                      <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer hint */}
          {allModels.length > 0 && (
            <div className="px-3 py-2 border-t border-border-subtle text-xs text-text-secondary">
              {allModels.length} models available • Type to filter
            </div>
          )}
        </div>
      )}
    </div>
  )
}
