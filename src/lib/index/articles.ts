import { searchIndex, type SearchIndexResponse } from './searchIndex'
import { type Article } from './schemas'

interface SearchArticlesParams {
  page?: number
  size?: number
  where: {
    text?: string
  }
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}

const search = async (endpoint: URL, accessToken: string, params?: SearchArticlesParams): Promise<SearchIndexResponse<Article>> => {
  const sort: Array<Record<string, 'asc' | 'desc'>> = [{ 'heads.usable.created': 'desc' }]

  const query = {
    query: {
      bool: {
        must: [
          // The core_article index includes items written in e.g. norwegian or danish, so we filter those out
          {
            term: {
              'document.language': 'sv'
            }
          },
          {
            prefix: {
              'document.title': {
                value: params?.where?.text,
                boost: 2.0,
                case_insensitive: true
              }
            }
          }
        ]
      }
    },
    _source: true,
    fields: [
      'document.title',
      'heads.usable.*'
    ],
    sort
  }
  return await searchIndex(
    query,
    {
      index: 'core_article',
      endpoint,
      accessToken
    },
    params?.page,
    params?.size
  )
}

export const Articles = {
  search
}
