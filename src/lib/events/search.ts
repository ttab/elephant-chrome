import { type SearchIndexResponse, type Event } from '../index'
import { searchIndex } from '../index'

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
  try {
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

    const allResults: Event[] = []
    let skip = 0
    const size = params?.size || 100 // Default size if not provided

    while (true) {
      const response: SearchIndexResponse<Event> = await searchIndex(
        query,
        {
          index: 'core_event',
          endpoint,
          accessToken
        },
        skip,
        size
      )

      allResults.push(...response.hits)

      if (response.hits.length < size) {
        break
      }

      skip += size
    }

    return {
      hits: allResults,
      total: allResults.length,
      ok: true
    }
  } catch (ex) {
    throw new Error('Failed to search for events', { cause: ex })
  }
}
