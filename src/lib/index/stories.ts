import { type IndexedStory } from './schemas/story'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface SearchParams {
  page?: number
  size?: number
}

const get = async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse<IndexedStory>> => {
  const query = {
    query: {
      match_all: {}
    }
  }

  return await searchIndex(
    query,
    {
      index: 'core_story',
      endpoint,
      accessToken
    },
    params?.page,
    params?.size
  )
}

export const Stories = {
  get
}
