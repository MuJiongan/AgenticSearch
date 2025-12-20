import { useState } from 'react'
import type { ToolCall } from '../types/index.js'

type ToolActivityLogProps = {
  toolCalls: ToolCall[]
}

const TOOL_LABELS: Record<string, string> = {
  search_web: 'Searching the web',
  extract_url: 'Reading content'
}

type ParsedToolArgs = {
  // search_web
  objective?: string
  search_queries?: string[]
  max_results?: number
  // extract_url
  urls?: string[]
  excerpts?: boolean
}

function parseToolArgs(toolCall: ToolCall): ParsedToolArgs {
  try {
    return JSON.parse(toolCall.function.arguments)
  } catch {
    return {}
  }
}

function getToolIcon(name: string, color: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    search_web: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ stroke: color }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    extract_url: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ stroke: color }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
  return icons[name] || '🔧'
}

function formatToolMessage(toolCall: ToolCall): string {
  const args = JSON.parse(toolCall.function.arguments)

  if (toolCall.function.name === 'search_web') {
    return args.objective || 'Searching...'
  }

  if (toolCall.function.name === 'extract_url') {
    const urlCount = args.urls?.length || 0
    return `Analyzing ${urlCount} source${urlCount !== 1 ? 's' : ''}`
  }

  return toolCall.function.name
}

function ToolDetails({ toolCall }: { toolCall: ToolCall }) {
  const args = parseToolArgs(toolCall)

  if (toolCall.function.name === 'search_web') {
    return (
      <div className="mt-2 space-y-2 text-xs">
        {args.search_queries && args.search_queries.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-60">
              Search Queries
            </div>
            <div className="flex flex-wrap gap-1.5">
              {args.search_queries.map((query, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30"
                >
                  <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {query}
                </span>
              ))}
            </div>
          </div>
        )}
        {args.max_results && (
          <div className="text-text-secondary opacity-70">
            Max results: <span className="font-medium">{args.max_results}</span>
          </div>
        )}
      </div>
    )
  }

  if (toolCall.function.name === 'extract_url') {
    return (
      <div className="mt-2 space-y-1.5 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-60">
          URLs to Extract
        </div>
        {args.urls && args.urls.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {args.urls.map((url, i) => {
              let displayUrl = url
              try {
                const parsed = new URL(url)
                displayUrl = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '')
              } catch {
                // Keep original if parsing fails
              }
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-border-subtle"
                >
                  <svg className="w-3 h-3 text-text-secondary opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="truncate text-text-secondary">{displayUrl}</span>
                </div>
              )
            })}
          </div>
        )}
        {args.objective && (
          <div className="text-text-secondary opacity-70 pt-1">
            Objective: <span className="font-medium italic">{args.objective}</span>
          </div>
        )}
      </div>
    )
  }

  return null
}

export function ToolActivityLog({ toolCalls }: ToolActivityLogProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  if (toolCalls.length === 0) {
    return null
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-3 overflow-hidden">
      <div className="flex items-center gap-3 text-text-secondary mb-2">
        <div className="flex -space-x-2 flex-shrink-0">
          {toolCalls.slice(-3).map((tc, i) => (
            <div
              key={tc.id || i}
              className={`w-7 h-7 rounded-full ring-2 ring-bg-main flex items-center justify-center ${tc.status === 'executing'
                ? 'bg-brand-primary/10 ring-brand-primary/30 animate-pulse'
                : 'bg-[#f3f4f6] dark:bg-gray-800'
                }`}
            >
              {getToolIcon(tc.function.name, '#10a37f')}
            </div>
          ))}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-60 truncate">Researching Process</span>
      </div>

      <div className="space-y-2">
        {toolCalls.slice(-3).map((toolCall, idx) => {
          const toolId = toolCall.id || `tool-${idx}`
          const isExpanded = expandedIds.has(toolId)

          return (
            <div key={toolId} className="space-y-2">
              {/* Show preContent if present */}
              {toolCall.preContent && (
                <div className="pl-3 border-l-2 border-brand-primary/30">
                  <p className="text-sm text-text-secondary italic line-clamp-2">
                    {toolCall.preContent}
                  </p>
                </div>
              )}
              <div
                className={`rounded-xl border transition-all ${toolCall.status === 'executing'
                  ? 'bg-brand-primary/[0.03] border-brand-primary/20 text-text-primary'
                  : 'bg-gray-100/80 dark:bg-gray-800/10 border-border-subtle text-text-secondary opacity-70'
                  }`}
              >
                <button
                  onClick={() => toggleExpand(toolId)}
                  className="w-full flex items-center gap-3 p-3 text-left touch-manipulation"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${toolCall.status === 'executing'
                    ? 'bg-brand-primary/10'
                    : 'bg-[#f3f4f6] dark:bg-gray-800'
                    }`}>
                    {getToolIcon(toolCall.function.name, '#10a37f')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      {TOOL_LABELS[toolCall.function.name] || toolCall.function.name}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {formatToolMessage(toolCall)}
                    </div>
                  </div>
                  {toolCall.status === 'executing' && (
                    <div className="flex gap-1.5 px-2">
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-bounce"></div>
                    </div>
                  )}
                  {toolCall.status === 'complete' && (
                    <div className="p-1 px-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <svg
                    className={`w-4 h-4 text-text-secondary opacity-50 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border-subtle/50">
                    <ToolDetails toolCall={toolCall} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

