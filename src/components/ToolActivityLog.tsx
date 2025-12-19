import type { ToolCall } from '../types/index.js'

type ToolActivityLogProps = {
  toolCalls: ToolCall[]
}

const TOOL_LABELS: Record<string, string> = {
  search_web: 'Searching the web',
  extract_url: 'Reading content'
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  search_web: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  extract_url: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
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

export function ToolActivityLog({ toolCalls }: ToolActivityLogProps) {
  if (toolCalls.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-text-secondary mb-2">
        <div className="flex -space-x-2">
          {toolCalls.slice(-3).map((tc, i) => (
            <div
              key={tc.id || i}
              className={`w-7 h-7 rounded-full ring-2 ring-bg-main flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-text-secondary ${tc.status === 'executing' ? 'bg-brand-primary/10 text-brand-primary ring-brand-primary/30 animate-pulse' : 'opacity-60'
                }`}
            >
              {TOOL_ICONS[tc.function.name] || '🔧'}
            </div>
          ))}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Researching Process</span>
      </div>

      <div className="space-y-2">
        {toolCalls.slice(-2).map((toolCall, idx) => (
          <div
            key={toolCall.id || idx}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${toolCall.status === 'executing'
              ? 'bg-brand-primary/[0.03] border-brand-primary/20 text-text-primary'
              : 'bg-gray-50/50 dark:bg-gray-800/10 border-border-subtle text-text-secondary opacity-70'
              }`}
          >
            <div className={`p-2 rounded-lg ${toolCall.status === 'executing' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>
              {TOOL_ICONS[toolCall.function.name] || '🔧'}
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
          </div>
        ))}
      </div>

    </div>
  )
}

