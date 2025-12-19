import type { Source } from '../types/index.js'

type SourceCitationsProps = {
  sources: Source[]
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (sources.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-text-secondary mb-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-sm font-medium">Sources</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((source, idx) => {
          const domain = new URL(source.url).hostname
          return (
            <a
              key={`${source.url}-${idx}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 border border-border-subtle rounded-xl bg-bg-card hover:border-brand-primary/30 hover:shadow-md transition-all flex flex-col justify-between min-h-[100px]"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-6 h-6 rounded flex-shrink-0 overflow-hidden bg-bg-main border border-border-subtle mt-0.5">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <h4 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
                  {source.title}
                </h4>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] text-text-secondary font-medium tracking-wide uppercase truncate max-w-[120px]">
                  {domain.replace('www.', '')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-bg-main text-text-secondary rounded font-bold ring-1 ring-border-subtle">
                  {idx + 1}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

