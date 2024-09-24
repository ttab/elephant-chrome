import { searchIndex, type SearchIndexResponse } from './searchIndex'

export interface SearchParams {
  page?: number
  size?: number
}

export const get = async <T>(endpoint: URL, accessToken: string, index: string, params?: SearchParams): Promise<SearchIndexResponse<T>> => {
  const query = {
    query: {
      range: {
        'heads.usable.version': {
          gte: 1
        }
      }
    }
  }

  return await searchIndex(
    query,
    {
      index,
      endpoint,
      accessToken
    },
    params?.page,
    params?.size
  )
}
