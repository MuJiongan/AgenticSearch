import { useState, useMemo } from 'react'
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

/**
 * Normalizes a URL for comparison by:
 * - Removing trailing slashes
 * - Removing common tracking parameters
 * - Lowercasing the hostname
 * - Removing fragments
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase()
    // Remove fragment
    parsed.hash = ''
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source']
    trackingParams.forEach(param => parsed.searchParams.delete(param))
    // Get the URL and remove trailing slash from pathname
    let normalized = parsed.toString()
    // Remove trailing slash (but not for root paths)
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1)
    }
    return normalized
  } catch {
    // If URL parsing fails, return as-is but lowercase and trimmed
    return url.toLowerCase().trim().replace(/\/+$/, '')
  }
}

/**
 * Extracts the core domain and path for fuzzy matching
 * Used when exact normalized matching fails
 */
function extractCorePath(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove www prefix and get domain + path without query/fragment
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${domain}${path}`
  } catch {
    return url.toLowerCase().trim()
  }
}

export function StreamingResponse({ content, status, sources }: StreamingResponseProps) {
  const [copied, setCopied] = useState(false)

  // Build lookup maps for efficient URL matching
  // Uses both normalized URLs and core paths for fuzzy matching
  const urlLookup = useMemo(() => {
    const normalizedMap = new Map<string, number>()
    const corePathMap = new Map<string, number>()

    sources.forEach((source, index) => {
      const normalized = normalizeUrl(source.url)
      const corePath = extractCorePath(source.url)

      // Only add if not already present (first occurrence wins)
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, index)
      }
      if (!corePathMap.has(corePath)) {
        corePathMap.set(corePath, index)
      }
    })

    return { normalizedMap, corePathMap }
  }, [sources])

  // Function to find source index with fallback matching
  const findSourceIndex = (href: string): number => {
    // First try exact normalized match
    const normalizedHref = normalizeUrl(href)
    let index = urlLookup.normalizedMap.get(normalizedHref)
    if (index !== undefined) return index

    // Fallback to core path matching (domain + path only)
    const corePathHref = extractCorePath(href)
    index = urlLookup.corePathMap.get(corePathHref)
    if (index !== undefined) return index

    return -1
  }

  if (!content && status !== 'synthesizing') {
    return null
  }

  // Show thinking indicator when synthesizing but no content yet
  const isThinking = status === 'synthesizing' && !content

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

      {isThinking && (
        <div className="flex items-center gap-3 py-6">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"></span>
          </div>
          <span className="text-sm text-text-secondary font-medium">Generating response...</span>
        </div>
      )}

      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({ node, children, href, ...props }: any) {
              const sourceIndex = href ? findSourceIndex(href) : -1

              if (sourceIndex !== -1) {
                return (
                  <sup className="citation-sup">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="citation-badge"
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

