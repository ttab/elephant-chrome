import { searchIndex, type SearchIndexResponse } from './searchIndex'
import { type Article } from './schemas'
import type { QueryParams } from '@/hooks/useQuery'
import type { QueryType } from '@/types/index'
import { makeMatchQuery } from '../makeMatchQuery'

interface SearchArticlesParams {
  page?: number
  size?: number
  where: {
    text?: string
  }
  query?: QueryParams
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}

/**
 * @deprecated This function is deprecated and will be removed in future versions.
 * TODO: use Twirp api and wrap in a hook #ELE-1171
 */
const search = async (endpoint: URL, accessToken: string, params?: SearchArticlesParams): Promise<SearchIndexResponse<Article>> => {
  const sort: Array<Record<string, 'asc' | 'desc'>> = [{ 'heads.usable.created': 'desc' }]

  const dateQuery = params?.query?.from
    ? {
        range: {
          'heads.usable.created': {
            gte: new Date(params?.query?.from as string).toISOString()
          }
        }
      }
    : {}

  const query: QueryType = {
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
            range: {
              'heads.usable.version': {
                gte: 1
              }
            }
          }
        ],
        should: []
      }
    },
    _source: true,
    fields: [
      'document.title',
      'heads.usable.*',
      'heads.usable.version'
    ],
    sort
  }

  if (params?.where.text) {
    query.query.bool.must.push({
      multi_match: {
        query: params?.where.text,
        type: 'phrase_prefix',
        fields: [
          'document.title',
          'document.content.core_text.data.text',
          'document.meta.tt_slugline.value',
          'document.rel.subject.title'
        ]
      }
    })
  }

  if (params?.query?.section) {
    query.query.bool.must.push(makeMatchQuery(params?.query?.section, 'document.rel.section.uuid'))
  }

  if (params?.query?.newsvalue) {
    query.query.bool.must.push(makeMatchQuery(params?.query?.newsvalue, 'document.meta.core_newsvalue.value'))
  }

  if (params?.query?.author) {
    query.query.bool.must.push(makeMatchQuery(params?.query?.author, 'document.rel.author.uuid'))
  }

  if (params?.query?.from) {
    query.query.bool.must.push(dateQuery)
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
