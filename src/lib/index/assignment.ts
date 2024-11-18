import { type LoadedDocumentItem } from '@/views/Assignments/types'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface Params {
  endpoint: URL
  accessToken: string
  start?: Date
  page?: number
  size?: number
  text?: string
}

const search = async ({ endpoint, accessToken, start, page = 1, size = 100, text }: Params): Promise<SearchIndexResponse<LoadedDocumentItem>> => {
  const today = start ? new Date(start) : new Date()
  today.setHours(0, 0, 0, 0)

  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(today)
  const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(today)
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(today)

  const hour = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23' }).format(today).padStart(2, '0')
  const minute = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(today).padStart(2, '0')
  const second = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(today).padStart(2, '0')

  const todayFormatted = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`

  const sort: Array<Record<string, string>> = []

  if (text) {
    sort.push(
      { field: 'document.meta.core_newsvalue.value' },
      { field: 'document.meta.core_assignment.data.start_date' }
    )
  }

  const dateQuery = {
    bool: {
      must: [
        {
          term: {
            field: 'document.meta.core_assignment.data.start_date',
            value: todayFormatted
          }
        },
        {
          term: {
            field: 'document.meta.core_planning_item.data.start_date',
            value: todayFormatted
          }
        }
      ]
    }
  }

  const matchTextQuery = {
    bool: {
      must: [
        {
          match: {
            field: 'document.meta.core_assignment.title',
            value: text
          }
        }
      ]
    }
  }

  const query = {
    document_type: 'core/planning-item',
    query: text ? matchTextQuery : dateQuery,
    load_document: true,
    sort
  }

  return await searchIndex(
    query,
    {
      index: '',
      endpoint,
      accessToken,
      assignmentSearch: true
    },
    page,
    size
  )
}

export const Assignments = {
  search
}
