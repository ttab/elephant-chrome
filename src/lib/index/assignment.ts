import { type LoadedDocumentItem, type AssignmentResponse } from '@/views/Assignments/types'
import { pagination } from '../pagination'

interface Params {
  endpoint: URL
  accessToken: string
  start: Date
  page?: number
  size?: number
}

const search = async ({ endpoint, accessToken, start, page = 1, size = 100 }: Params): Promise<AssignmentResponse<LoadedDocumentItem>> => {
  const { from, pageSize } = pagination({
    page,
    size
  })

  const today = new Date(start)
  today.setHours(0, 0, 0, 0)

  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(today)
  const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(today)
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(today)

  const hour = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23' }).format(today).padStart(2, '0')
  const minute = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(today).padStart(2, '0')
  const second = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(today).padStart(2, '0')

  const todayFormatted = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`

  const query = {
    document_type: 'core/planning-item',
    query: {
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
    },
    load_document: true,
    size: 150,
    sort: [
      {
        field: 'document.meta.core_newsvalue.value'
      }
    ]
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken
    },
    body: JSON.stringify(query)
  })

  return await response.json()
}

export const Assignments = {
  search
}
