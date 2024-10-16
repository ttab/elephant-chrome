import { type Item, type Response } from '@/views/Assignments/types'


// interface Params {
//   page?: number
//   size?: number
//   query?: object
//   where?: {
//     start?: string | Date
//     end?: string | Date
//   }
//   sort?: {
//     start?: 'asc' | 'desc'
//     end?: 'asc' | 'desc'
//   }
// }

interface Params {
  endpoint: URL
  accessToken: string
}

const search = async ({ endpoint, accessToken }: Params): Promise<Response<Item>> => {
  // const start = params?.where?.start ? new Date(params.where.start) : new Date()
  // const end = params?.where?.end ? new Date(params.where.end) : new Date()

  const today = new Date()
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
    sort: [
      {
        field: 'document.meta.core_assignment.data.start'
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
