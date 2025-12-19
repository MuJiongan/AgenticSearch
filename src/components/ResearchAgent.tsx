import { useResearchAgent } from '../hooks/useResearchAgent.js'
import { useOpenRouterModels } from '../hooks/useOpenRouterModels.js'
import { ApiKeyConfig } from './ApiKeyConfig.js'
import { ModelSelector } from './ModelSelector.js'
import { QueryInput } from './QueryInput.js'
import { ErrorDisplay } from './ErrorDisplay.js'
import { ToolActivityLog } from './ToolActivityLog.js'
import { StreamingResponse } from './StreamingResponse.js'
import { SourceCitations } from './SourceCitations.js'
import { ThemeToggle } from './ThemeToggle.js'
import { ResponseMetrics } from './ResponseMetrics.js'

export function ResearchAgent() {
  const { state, apiKeys, setApiKeys, submitQuery, selectModel, reset, retry } = useResearchAgent()
  const { allModels } = useOpenRouterModels(apiKeys.openrouter)

  const isProcessing = state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error'
  const hasStarted = state.status !== 'idle' || state.currentResponse || state.toolCalls.length > 0

  // Get current model's pricing from OpenRouter
  const currentModelPricing = allModels.find(m => m.id === state.model)?.pricing

  return (
    <div className="min-h-screen bg-bg-main text-text-primary selection:bg-brand-primary/20 transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border-subtle bg-bg-nav backdrop-blur-md z-50 flex items-center justify-between px-6 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight">AgenticSearch</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ApiKeyConfig apiKeys={apiKeys} onSave={setApiKeys} />
        </div>
      </nav>

      <main className="pt-20 sm:pt-24 pb-32 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto overflow-x-hidden">
        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] sm:min-h-[75vh] animate-fade-in-up">

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 tracking-tight text-center px-2">
              What do you want to <span className="text-brand-primary">research</span> today?
            </h1>

            <div className="w-full max-w-2xl glass rounded-2xl p-2 mb-8">
              <ModelSelector
                value={state.model}
                onChange={selectModel}
                disabled={isProcessing}
                apiKey={apiKeys.openrouter}
              />
              <QueryInput
                onSubmit={submitQuery}
                disabled={isProcessing}
              />
            </div>
          </div>

        ) : (
          <div className="space-y-8 sm:space-y-12 animate-fade-in-up">
            <header className="border-b border-border-subtle pb-6 sm:pb-8 flex flex-col items-center text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 tracking-tight break-words max-w-full px-2">
                {state.lastQuery || "Research Results"}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium text-text-secondary px-2">
                <span className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full ring-1 ring-brand-primary/20 max-w-full">
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse flex-shrink-0"></span>
                  <span className="truncate max-w-[150px] sm:max-w-none">{state.model.split('/')[1] || state.model}</span>
                </span>
                {isProcessing && (
                  <span className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full ring-1 ring-blue-100 dark:ring-blue-900/30">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    <span className="truncate">{state.status === 'searching' ? 'Researching...' : state.status}...</span>
                  </span>
                )}
              </div>
            </header>



            <div className="grid gap-12">
              <ToolActivityLog toolCalls={state.toolCalls} />

              <StreamingResponse
                content={state.currentResponse}
                status={state.status}
                sources={state.sources}
              />

              {state.currentResponse && <ResponseMetrics usage={state.usage} modelPricing={currentModelPricing} />}

              <SourceCitations sources={state.sources} />

              {state.status === 'complete' && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-full hover:bg-brand-secondary transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
                  >
                    <span>Start New Research</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {state.error && (
          <div className="fixed bottom-8 right-8 z-50 max-w-md">
            <ErrorDisplay error={state.error} onDismiss={reset} onRetry={retry} />
          </div>
        )}
      </main>

      {hasStarted && !isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-bg-main via-bg-main to-transparent pt-8 sm:pt-12 pb-4 sm:pb-8 px-3 sm:px-6 md:px-8 pointer-events-none">
          <div className="max-w-2xl mx-auto glass rounded-2xl p-2 shadow-2xl pointer-events-auto">
            <QueryInput
              onSubmit={submitQuery}
              disabled={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  )
}


