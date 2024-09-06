import { type Planning } from '../index'
import {
  searchIndex,
  type SearchIndexResponse
} from '../index/searchIndex'

interface SearchPlanningParams {
  skip?: number
  size?: number
  where?: {
    start?: string | Date
    end?: string | Date
  }
}
// request planning items what has related calendar events
export const relatedPlanningSearch = async (endpoint: URL, accessToken: string, uuids: string[], params?: SearchPlanningParams): Promise<SearchIndexResponse<Planning>> => {
  const query = {
    query: {
      bool: {
        filter: [
          {
            terms: {
              'document.rel.event.uuid': uuids
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

  return await searchIndex<Planning>(
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
