import { type SearchIndexResponse } from '../index'
import { searchIndex } from '../index/events-search'

interface SearchEventsParams {
  skip?: number
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

export const search = async (endpoint: URL, accessToken: string, params?: SearchEventsParams): Promise<SearchIndexResponse<Event>> => {
  const start = params?.where?.start ? new Date(params.where.start) : new Date()
  const end = params?.where?.end ? new Date(params.where.end) : new Date()
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  if (params?.sort?.start && ['asc', 'desc'].includes(params.sort.start)) {
    sort.push({ 'document.meta.core_event.data.start': params.sort.start })
  }

  if (params?.sort?.end) {
    sort.push({ 'document.meta.core_event.data.end': params.sort.end })
  }

  sort.push({ 'document.meta.core_newsvalue.value': 'desc' })

  const query = {
    query: {
      bool: {
        must: [
          {
            range: {
              'document.meta.core_event.data.start': {
                gte: start.toISOString(),
                lte: end.toISOString()
              }
            }
          }
        ],
        must_not: [
          {
            term: {
              'document.meta.core_event.data.end': 'now+1d/d'
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
      index: 'core_event',
      endpoint,
      accessToken
    },
    params?.skip,
    params?.size
  )
}
