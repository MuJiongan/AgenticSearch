import type { ToolCall, Source } from '../../types/index.js'
import { searchWeb } from '../parallel/search.js'
import { extractUrls } from '../parallel/extract.js'

export async function executeToolCall(
  toolCall: ToolCall,
  parallelApiKey: string,
  onSourceAdded: (source: Source) => void
): Promise<any> {
  const { name, arguments: args } = toolCall.function

  let parsedArgs: any
  try {
    parsedArgs = JSON.parse(args)
  } catch (e) {
    throw new Error(`Failed to parse tool arguments: ${args}`)
  }

  if (name === 'search_web') {
    const result = await searchWeb({
      apiKey: parallelApiKey,
      objective: parsedArgs.objective,
      search_queries: parsedArgs.search_queries,
      max_results: parsedArgs.max_results
    })

    // Add sources from search results
    result.results.forEach(r => {
      onSourceAdded({
        url: r.url,
        title: r.title,
        type: 'search',
        timestamp: Date.now()
      })
    })

    // Return simplified results for LLM
    return {
      search_id: result.search_id,
      results: result.results.map(r => ({
        url: r.url,
        title: r.title,
        publish_date: r.publish_date,
        excerpts: r.excerpts
      }))
    }
  }

  if (name === 'extract_url') {
    const result = await extractUrls({
      apiKey: parallelApiKey,
      urls: parsedArgs.urls,
      objective: parsedArgs.objective,
      excerpts: parsedArgs.excerpts ?? true
    })

    // Add sources from extracted URLs
    parsedArgs.urls.forEach((url: string, index: number) => {
      onSourceAdded({
        url,
        title: result.results[index]?.url || url,
        type: 'extract',
        timestamp: Date.now()
      })
    })

    // Return content for LLM
    return {
      results: result.results.map(r => ({
        url: r.url,
        content: r.excerpts ? r.excerpts.join('\n\n') : r.content
      }))
    }
  }

  throw new Error(`Unknown tool: ${name}`)
}
