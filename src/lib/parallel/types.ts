export type SearchParams = {
  apiKey: string
  objective: string
  search_queries?: string[]
  max_results?: number
}

export type ExtractParams = {
  apiKey: string
  urls: string[]
  objective: string
  excerpts?: boolean
  full_content?: boolean
}
