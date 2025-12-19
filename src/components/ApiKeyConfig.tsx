import { useState } from 'react'
import type { ApiKeys } from '../types/index.js'

type ApiKeyConfigProps = {
  apiKeys: ApiKeys
  onSave: (keys: ApiKeys) => void
}

export function ApiKeyConfig({ apiKeys, onSave }: ApiKeyConfigProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [localKeys, setLocalKeys] = useState(apiKeys)

  const handleSave = () => {
    onSave(localKeys)
    setIsOpen(false)
  }

  const hasKeys = apiKeys.openrouter && apiKeys.parallel

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${hasKeys
          ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
          : 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/20'
          }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${hasKeys ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
        {hasKeys ? 'Connected' : 'Setup Required'}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 bg-bg-main rounded-2xl shadow-2xl border border-border-subtle p-6 z-50 animate-fade-in-up">
            <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              API Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">
                  OpenRouter Key
                </label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={localKeys.openrouter}
                  onChange={(e) => setLocalKeys({ ...localKeys, openrouter: e.target.value })}
                  placeholder="sk-or-..."
                  className="w-full px-3 py-2 bg-bg-main border border-border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 text-text-primary placeholder:text-text-secondary/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">
                  Parallel Key
                </label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={localKeys.parallel}
                  onChange={(e) => setLocalKeys({ ...localKeys, parallel: e.target.value })}
                  placeholder="pa-..."
                  className="w-full px-3 py-2 bg-bg-main border border-border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 text-text-primary placeholder:text-text-secondary/30"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showKeys}
                    onChange={(e) => setShowKeys(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border-subtle bg-bg-main text-brand-primary focus:ring-brand-primary/20"
                  />
                  <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Show keys</span>
                </label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-brand-primary hover:underline"
                >
                  GET KEYS
                </a>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/10"
                >
                  Save Config
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-bg-main text-text-secondary rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-border-subtle"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

