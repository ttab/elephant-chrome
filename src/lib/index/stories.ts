import { type IndexedStory } from './schemas'
import { type SearchIndexResponse } from './searchIndex'
import { get, type SearchParams } from './get'

export const Stories = {
  get: async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse<IndexedStory>> => {
    return await get<IndexedStory>(endpoint, accessToken, 'core_story', params)
  }
}
