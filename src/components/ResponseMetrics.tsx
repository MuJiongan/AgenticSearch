import type { UsageMetrics } from '../types/index.js'

type ResponseMetricsProps = {
  usage?: UsageMetrics
  model: string
  modelPricing?: {
    prompt: string
    completion: string
  }
}

function calculateCost(usage: UsageMetrics, modelPricing?: { prompt: string; completion: string }): number | null {
  // Only calculate cost if pricing is available
  if (!modelPricing) {
    return null
  }

  const promptPrice = parseFloat(modelPricing.prompt) || 0
  const completionPrice = parseFloat(modelPricing.completion) || 0

  const promptCost = (usage.promptTokens / 1_000_000) * promptPrice
  const completionCost = (usage.completionTokens / 1_000_000) * completionPrice

  return promptCost + completionCost
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

export function ResponseMetrics({ usage, model, modelPricing }: ResponseMetricsProps) {
  if (!usage || !usage.totalTokens) {
    return null
  }

  const cost = calculateCost(usage, modelPricing)
  const tokensPerSec = usage.tokensPerSecond || 0
  const duration = usage.durationMs || (usage.endTime && usage.startTime ? usage.endTime - usage.startTime : 0)

  return (
    <div className="mt-6 p-4 bg-bg-nav border border-border-subtle rounded-xl">
      <div className="flex items-center gap-2 text-text-secondary mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-sm font-medium">Response Metrics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary mb-1">Total Tokens</span>
          <span className="text-lg font-semibold text-text-primary">
            {usage.totalTokens.toLocaleString()}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">
            {usage.promptTokens.toLocaleString()} prompt + {usage.completionTokens.toLocaleString()} completion
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-text-secondary mb-1">Speed</span>
          <span className="text-lg font-semibold text-text-primary">
            {tokensPerSec > 0 ? tokensPerSec.toFixed(1) : '—'}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">tokens/sec</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-text-secondary mb-1">Duration</span>
          <span className="text-lg font-semibold text-text-primary">
            {duration > 0 ? formatDuration(duration) : '—'}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">total time</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-text-secondary mb-1">Estimated Cost</span>
          <span className="text-lg font-semibold text-brand-primary">
            {cost !== null ? `$${cost.toFixed(4)}` : '—'}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">
            {cost !== null ? 'USD' : 'unavailable'}
          </span>
        </div>
      </div>
    </div>
  )
}
