import { type IndexedSection } from './schemas'
import { type SearchIndexResponse } from './searchIndex'
import { get, type SearchParams } from './get'

export const Sections = {
  get: async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse<IndexedSection>> => {
    return await get<IndexedSection>(endpoint, accessToken, 'core_section', params)
  }
}
