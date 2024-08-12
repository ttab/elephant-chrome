import { type IndexedAuthor } from './schemas/author'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface SearchParams {
  page?: number
  size?: number
}

const get = async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse<IndexedAuthor>> => {
  const query = {
    query: {
      match_all: {}
    }
  }

  return await searchIndex(
    query,
    {
      index: 'core_author',
      endpoint,
      accessToken
    },
    params?.page,
    params?.size
  )
}

export const Authors = {
  get
}
