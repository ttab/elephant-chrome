import { type JWT } from '@/types'
import { searchIndex, type SearchIndexResponse } from '../index/search'

interface SaerchPlanningParams {
  skip?: number
  size?: number
  where?: {
    startDate?: string | Date
  }
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}

export const search = async (endpoint: URL, jwt: JWT, params?: SaerchPlanningParams): Promise<SearchIndexResponse> => {
  const startDate = params?.where?.startDate ? new Date(params.where.startDate) : new Date()
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  if (params?.sort?.start && ['asc', 'desc'].includes(params.sort.start)) {
    sort.push({ 'document.meta.core_assignment.data.start': params.sort.start })
  }

  if (params?.sort?.end) {
    sort.push({ 'document.meta.core_assignment.data.end': params.sort.end })
  }

  sort.push({ 'document.meta.core_planning_item.data.priority': 'asc' })

  const query = {
    query: {
      bool: {
        must: [
          {
            term: {
              'document.meta.core_assignment.data.start_date': startDate.toISOString()
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
      index: 'core_planning_item',
      endpoint,
      jwt
    },
    params?.skip,
    params?.size
  )
}
