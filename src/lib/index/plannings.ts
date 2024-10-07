import { type Planning } from './schemas'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface SearchPlanningParams {
  page?: number
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

const search = async (endpoint: URL, accessToken: string, params?: SearchPlanningParams): Promise<SearchIndexResponse<Planning>> => {
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
            range: {
              'document.meta.core_planning_item.data.start_date': {
                gte: params?.where?.start,
                lte: params?.where?.end
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

  const allResults: Planning[] = []
  let page = 1
  const size = params?.size || 100

  while (true) {
    const response: SearchIndexResponse<Planning> = await searchIndex(
      query,
      {
        index: 'core_planning_item',
        endpoint,
        accessToken
      },
      page,
      size
    )


    allResults.push(...response.hits)

    if (response.hits.length < size) {
      break
    }

    page += 1
  }

  return {
    hits: allResults,
    total: allResults.length,
    ok: true
  }
}

export const Plannings = {
  search
}
