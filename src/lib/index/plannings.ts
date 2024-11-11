import { type Planning } from './schemas'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface SearchPlanningParams {
  page?: number
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

const search = async (endpoint: URL, accessToken: string, params?: SearchPlanningParams): Promise<SearchIndexResponse<Planning>> => {
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

  sort.push({ 'document.meta.core_newsvalue.value': 'desc' })

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
        bool: {
          should: [
            {
              prefix: {
                'document.title': {
                  value: params.where.text,
                  boost: 2,
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
