import { subHours } from 'date-fns'
import { type SearchIndexResponse, type Event } from '../index'
import { searchIndex } from '../index'

export interface EventSearchParams {
  page?: number
  skip?: number
  size?: number
  when?: 'anytime' | 'fixed'
  where?: {
    start?: string | Date
    end?: string | Date
    text?: string
  }
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}


/**
 * @deprecated This function is deprecated and will be removed in future versions.
 * TODO: use Twirp api and wrap in a hook
 */
export const search = async (endpoint: URL, accessToken: string, params?: EventSearchParams): Promise<SearchIndexResponse<Event>> => {
  if (params && (!params?.when || params?.when !== 'anytime')) {
    params.when = 'fixed'
  }
  const start = params?.where?.start ? new Date(params.where.start) : new Date()
  const end = params?.where?.end ? new Date(params.where.end) : new Date()
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  if (params?.sort?.start && ['asc', 'desc'].includes(params.sort.start)) {
    sort.push({ 'document.meta.core_event.data.start': params.sort.start })
  }

  if (params?.sort?.end) {
    sort.push({ 'document.meta.core_event.data.end': params.sort.end })
  }

  if (params?.when !== 'anytime') {
    // in Search view we don't group by newsvalue, so sorting by doesn't make sense
    sort.push({ 'document.meta.core_newsvalue.value': 'desc' })
  }

  sort.push({ 'document.meta.core_event.data.start': 'asc' })

  const timeRange = params?.when === 'anytime'
    ? undefined
    : [
        {
          range: {
            'document.meta.core_event.data.end': {
              gte: subHours(start.toISOString(), 1),
              lte: subHours(end.toISOString(), 1)
            }
          }
        }
      ]


  const textCriteria = !params?.where?.text
    ? undefined
    : {
        bool: {
          should: [
            {
              prefix: {
                'document.title': {
                  value: params.where.text,
                  boost: 2.0,
                  case_insensitive: true
                }
              }
            },
            {
              prefix: {
                'document.rel.section.title': {
                  value: params.where.text,
                  case_insensitive: true
                }
              }
            }
          ]
        }
      }

  const query = {
    query: {
      bool: {
        must: []
      }
    },
    _source: true,
    fields: [
      'document.title',
      'heads.usable.*'
    ],
    sort
  }

  if (textCriteria) {
    // @ts-expect-error We don't have types for opensearch queries
    query.query.bool.must.push(textCriteria)
  }

  if (timeRange) {
    // @ts-expect-error We don't have types for opensearch queries
    query.query.bool.must.push(...timeRange)
  }

  return await searchIndex(
    query,
    {
      index: 'core_event',
      endpoint,
      accessToken
    },
    params?.skip || params?.page,
    params?.size
  )
}
