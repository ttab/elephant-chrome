import { searchIndex, type SearchIndexResponse } from './searchIndex'
import { type Planning } from '@/lib/index/schemas'

interface Params {
  page?: number
  size?: number
  query?: object
  where?: {
    start?: string | Date
    end?: string | Date
  }
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}

// Since assignment posts are not separate document, searches for the Assignments overview are conducted against
// the core_planning_item index, to retrieve assignments.
const search = async (endpoint: URL, accessToken: string, params: Params): Promise<SearchIndexResponse<Planning>> => {
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

  const query = {
    query: {
      bool: {
        must: [
          {
            exists: {
              field: 'document.meta.core_assignment.data.start'
            }
          },
          {
            exists: {
              field: 'document.meta.core_assignment.data.end'
            }
          },
          {
            range: {
              'document.meta.core_assignment.data.start_date': {
                gte: start.toISOString(),
                lte: end.toISOString()
              }
            }
          }
        ]
      }
    },
    _source: true,
    sort
  }

  return await searchIndex(
    query,
    {
      index: 'core_planning_item',
      endpoint,
      accessToken
    },
    params?.page,
    params.size
  )
}

export const Assignments = {
  search
}
