import { type Event, searchIndex, type SearchIndexResponse } from './index'

export const listDuplicates = async (endpoint: URL, accessToken: string, documentId: string): Promise<SearchIndexResponse<Event>> => {
  const query = {
    query: {
      bool: {
        must: [
          {
            term: {
              'document.meta.core_copy_group.uuid': documentId
            }
          }
        ]
      }
    },
    _source: true,
    fields: [
      'document.title',
      'heads.usable.*',
      'document.meta.core_event.data.start'
    ]
  }

  return await searchIndex<Event>(
    query,
    {
      index: 'core_event',
      endpoint,
      accessToken
    }
  )
}
