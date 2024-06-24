import { searchIndex, type SearchIndexResponse } from './search'

interface SearchParams {
  page?: number
  size?: number
  where?: {
    start?: string | Date
    end?: string | Date
  }
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}

const get = async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse> => {
  const query = {
    query: {
      match_all: {}
    },
    _source: true
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
