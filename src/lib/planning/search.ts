import { type JWT } from '@/types'
import { searchIndex, type SearchIndexResponse } from '../index/search'

export const search = async (endpoint: URL, jwt: JWT): Promise<SearchIndexResponse> => {
  return await searchIndex(
    query,
    {
      index: 'core_planning_item',
      endpoint,
      jwt
    }
  )
}

const query = {
  query: {
    bool: {
      must: [
        {
          term: {
            'document.meta.core_assignment.data.start_date': '2023-10-01T00:00:00Z'
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
  sort: [
    { 'document.meta.core_planning_item.data.priority': 'asc' }
  ]
}
