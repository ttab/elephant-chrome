import { subHours } from 'date-fns'
import { type SearchIndexResponse, type Event } from '../index'
import { searchIndex } from '../index'
import type { QueryParams } from '@/hooks/useQuery'
import type { QueryType } from '@/types/index'
import { makeMatchQuery } from '../makeMatchQuery'

export interface EventSearchParams {
  page?: number
  skip?: number
  size?: number
  when?: 'anytime' | 'fixed'
  query?: QueryParams
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
    // in Search view we don't group by newsvalue, so sorting by that doesn't make sense
    sort.push({ 'document.meta.core_newsvalue.value': 'desc' })
  }

  sort.push({ 'document.meta.core_event.data.start': 'asc' })

  const timeRange = params?.when === 'anytime'
    ? undefined
    : [
        {
          range: {
            'document.meta.core_event.data.start': {
              gte: subHours(start.toISOString(), 1),
              lte: subHours(end.toISOString(), 1)
            }
          }
        },
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
              multi_match: {
                query: params.where.text,
                type: 'phrase_prefix',
                fields: [
                  'document.title',
                  'document.meta.core_description.data.text',
                  'document.rel.organiser.title',
                  'document.meta.tt_slugline.value'
                ]
              }
            }
          ]
        }
      }

  const query: QueryType = {
    query: {
      bool: {
        should: [],
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

  if (params?.when === 'anytime') {
    query.query.bool.must.push(textCriteria)

    if (params?.query?.organiser) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.organiser, 'document.rel.organiser.uuid'))
    }

    if (params?.query?.category) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.category, 'document.rel.category.uuid'))
    }

    if (params?.query?.newsvalue) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.newsvalue, 'document.meta.core_newsvalue.value'))
    }

    if (params?.query?.section) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.section, 'document.rel.section.uuid'))
    }

    if (params?.query?.from) {
      query.query.bool.must.push({
        range: {
          'document.meta.core_event.data.start': {
            gte: new Date(params?.query?.from as string).toISOString()
          }
        }
      })
    }
  }

  if (timeRange) {
    query.query.bool.should.push(...timeRange)
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
