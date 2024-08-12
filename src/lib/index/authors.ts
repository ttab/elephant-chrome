import { type IndexedAuthor } from './schemas'
import { type SearchIndexResponse } from './searchIndex'
import { get, type SearchParams } from './get'

export const Authors = {
  get: async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse<IndexedAuthor>> => {
    return await get<IndexedAuthor>(endpoint, accessToken, 'core_author', params)
  }
}
