import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import type { ResearchStatus, Source } from '../types/index.js'

type StreamingResponseProps = {
  content: string
  status: ResearchStatus
  sources: Source[]
}

export function StreamingResponse({ content, status, sources }: StreamingResponseProps) {
  const [copied, setCopied] = useState(false)

  if (!content && status !== 'synthesizing') {
    return null
  }

  const isStreaming = status === 'synthesizing'

  // Detect if user prefers dark mode
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium">Research Summary</span>
        </div>
        {content && !isStreaming && (
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-brand-primary bg-bg-nav hover:bg-brand-primary/10 rounded-lg transition-all border border-border-subtle hover:border-brand-primary/30"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({ node, children, href, ...props }: any) {
              const sourceIndex = sources.findIndex(s => s.url === href)

              if (sourceIndex !== -1) {
                return (
                  <sup className="mx-0.5">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[9px] font-bold bg-brand-primary/10 text-brand-primary rounded-sm hover:bg-brand-primary hover:text-white transition-all no-underline border-none"
                      title={String(children)}
                    >
                      {sourceIndex + 1}
                    </a>
                  </sup>
                )
              }

              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline"
                  {...props}
                >
                  {children}
                </a>
              )
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <div className="relative group overflow-x-auto max-w-full">
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={isDarkMode ? vscDarkPlus : vs}
                    language={match[1]}
                    PreTag="div"
                    className={`!my-0 rounded-xl !p-6 ${isDarkMode ? '!bg-slate-900' : '!bg-gray-50'}`}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-bg-main text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono font-medium ring-1 ring-border-subtle" {...props}>
                  {children}
                </code>

              )
            }
          }}
        >
          {content}
        </ReactMarkdown>

        {isStreaming && (
          <div className="flex items-center gap-2 mt-4 text-brand-primary">
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
            <span className="text-sm font-medium animate-pulse tracking-wide">Synthesizing findings...</span>
          </div>
        )}
      </div>
    </div>
  )
}

