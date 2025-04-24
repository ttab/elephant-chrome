import type { QueryParams } from '@/hooks/useQuery'
import { type Planning } from './schemas'
import { searchIndex, type SearchIndexResponse } from './searchIndex'
import { makeMatchQuery } from '../makeMatchQuery'

export interface PlanningSearchParams {
  page?: number
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

interface QueryType {
  query: {
    bool: {
      should: unknown[]
      must: unknown[]
    }
  }
  _source: boolean
  fields: string[]
  sort: Array<Record<string, 'asc' | 'desc'>>
}

/**
 * @deprecated This function is deprecated and will be removed in future versions.
 * TODO: use Twirp api and wrap in a hook #ELE-1171
 */
const search = async (endpoint: URL, accessToken: string, params?: PlanningSearchParams): Promise<SearchIndexResponse<Planning>> => {
  if (params && (!params?.when || params?.when !== 'anytime')) {
    params.when = 'fixed'
  }

  const start = params?.where?.start ? new Date(params.where.start) : new Date()
  const end = params?.where?.end ? new Date(params.where.end) : new Date()
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  if (params?.sort?.start && ['asc', 'desc'].includes(params.sort.start)) {
    sort.push({ 'document.meta.core_assignment.data.start': params.sort.start })
  }

  if (params?.sort?.end) {
    sort.push({ 'document.meta.core_assignment.data.end': params.sort.end })
  }

  if (params?.when !== 'anytime') {
    // in search view we don't group by newsvalue, so sorting by doesn't make sense
    sort.push({ 'document.meta.core_newsvalue.value': 'desc' })
  }

  if (params?.when === 'anytime') {
    sort.push({ 'document.meta.core_planning_item.data.start_date': 'desc' })
  }

  const timeRange = params?.when === 'anytime'
    ? undefined
    : {
        range: {
          'document.meta.core_planning_item.data.start_date': {
            gte: start.toISOString(),
            lte: end.toISOString()
          }
        }
      }

  const textCriteria = !params?.where?.text
    ? undefined
    : {
        multi_match: {
          query: params.where.text,
          type: 'phrase_prefix',
          fields: [
            'document.title',
            'document.meta.core_assignment.title',
            'document.meta.core_description.data.text',
            'document.meta.tt_slugline.value'
          ]
        }
      }

  const query: QueryType = {
    query: {
      bool: {
        must: [],
        should: []
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
    if (textCriteria) {
      query.query.bool.must.push(textCriteria)
    }

    if (params?.query?.from) {
      query.query.bool.must.push({
        range: {
          'document.meta.core_planning_item.data.start_date': {
            gte: new Date(params?.query?.from as string).toISOString()
          }
        }
      })
    }

    if (params?.query?.author) {
      query.query.bool.must.push(makeMatchQuery(params.query.author, 'document.meta.core_assignment.rel.assignee.uuid'))
    }

    if (params?.query?.newsvalue) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.newsvalue, 'document.meta.core_newsvalue.value'))
    }

    if (params?.query?.section) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.section, 'document.rel.section.uuid'))
    }

    if (params?.query?.aType) {
      query.query.bool.must.push(makeMatchQuery(params?.query?.aType, 'document.meta.core_assignment.meta.core_assignment_type.value'))
    }
  }

  if (timeRange) {
    query.query.bool.must.push(timeRange)
  }

  return await searchIndex(
    query,
    {
      index: 'core_planning_item',
      endpoint,
      accessToken
    },
    params?.page,
    params?.size
  )
}

export const Plannings = {
  search
}
