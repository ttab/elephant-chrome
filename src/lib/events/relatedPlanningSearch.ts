import { searchIndex, type SearchIndexResponse } from '../index'

interface SearchPlanningParams {
  skip?: number
  size?: number
  where?: {
    start?: string | Date
    end?: string | Date
  }
}
// request planning items what has related calendar events
export const relatedPlanningSearch = async (endpoint: URL, accessToken: string, uuids: string[], params?: SearchPlanningParams): Promise<SearchIndexResponse> => {
  const start = params?.where?.start ? new Date(params.where.start) : new Date()
  const end = params?.where?.end ? new Date(params.where.end) : new Date()

  const query = {
    query: {
      bool: {
        filter: [
          {
            terms: {
              'document.rel.event.uuid': uuids
            }
          }
        ],
        must: [
          {
            range: {
              'document.meta.core_planning_item.data.start_date': {
                gte: start.toISOString(),
                lte: end.toISOString()
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
    ]
  }

  return await searchIndex(
    query,
    {
      index: 'core_planning_item',
      endpoint,
      accessToken
    },
    params?.skip,
    params?.size
  )
}
