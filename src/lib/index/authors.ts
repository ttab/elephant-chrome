import { searchIndex, type SearchIndexResponse } from './search'

interface SearchParams {
  page?: number
  size?: number
  where?: {
    start?: string | Date
    end?: string | Date
  }
  sort?: {
    name?: 'asc' | 'desc'
  }
}

const get = async (endpoint: URL, accessToken: string, params?: SearchParams): Promise<SearchIndexResponse> => {
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  if (params?.sort?.name) {
    sort.push(
      { 'document.meta.core_author.data.firstName': params.sort.name },
      { 'document.meta.core_author.data.lastName': params.sort.name }
    )
  }

  const query = {
    query: {
      match_all: {}
    },
    sort
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
