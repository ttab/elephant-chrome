import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface SearchParams {
  page?: number
  size?: number
}

/**
 * @deprecated This function is deprecated and will be removed in future versions.
 * TODO: use Twirp api and wrap in a hook #ELE-1171
 */
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
