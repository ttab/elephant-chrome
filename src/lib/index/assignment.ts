import { type LoadedDocumentItem } from '@/views/Assignments/types'
import { searchIndex, type SearchIndexResponse } from './searchIndex'
import type { QueryParams } from '@/hooks/useQuery'
import type { QueryType } from '@/types/index'

interface Params {
  endpoint: URL
  accessToken: string
  start?: Date
  page?: number
  size?: number
  text?: string
  paramsQuery?: QueryParams
}

/**
 * @deprecated This function is deprecated and will be removed in future versions.
 * TODO: use Twirp api and wrap in a hook #ELE-1171
 */
const search = async ({ endpoint, accessToken, start, page = 1, size = 100, text, paramsQuery = {} }: Params): Promise<SearchIndexResponse<LoadedDocumentItem>> => {
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

  const makeMatchQuery = (param: string | string[], field: string) => {
    if (Array.isArray(param)) {
      const arr = () => param?.map((value) => ({
        match: {
          field,
          value
        }
      }))

      return arr()
    } else {
      return {
        match: {
          field,
          value: param
        }
      }
    }
  }

  if (text) {
    sort.push(
      { field: 'document.meta.core_newsvalue.value' },
      { field: 'document.meta.core_assignment.data.start_date' }
    )
  }

  const dateQuery: QueryType = {
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
        ],
        should: []
      }
    }
  }

  const matchTextQuery: QueryType = {
    query: {
      bool: {
        must: [],
        should: []
      }
    }
  }

  const query = {
    document_type: 'core/planning-item',
    query: text || Object.keys(paramsQuery).length ? matchTextQuery.query : dateQuery.query,
    load_document: true,
    sort
  }

  if (text) {
    query.query.bool.must.push(makeMatchQuery(text, 'document.meta.core_assignment.title'))
  }

  if (Object.keys(paramsQuery).length > 0) {
    if (paramsQuery?.from) {
      query.query.bool.must.push({
        range: {
          field: 'document.meta.core_assignment.data.start_date',
          gte: paramsQuery?.from as string
        }
      })
    }

    if (paramsQuery?.author) {
      if (Array.isArray(paramsQuery?.author)) {
        query.query.bool.should.push(makeMatchQuery(paramsQuery?.author, 'document.meta.core_assignment.rel.assignee.uuid'))
      } else {
        query.query.bool.must.push(makeMatchQuery(paramsQuery?.author, 'document.meta.core_assignment.rel.assignee.uuid'))
      }
    }

    if (paramsQuery?.section) {
      if (Array.isArray(paramsQuery?.section)) {
        query.query.bool.should.push(makeMatchQuery(paramsQuery?.section, 'document.rel.section.uuid'))
      } else {
        query.query.bool.must.push(makeMatchQuery(paramsQuery?.section, 'document.rel.section.uuid'))
      }
    }

    if (paramsQuery?.newsvalue) {
      if (Array.isArray(paramsQuery.newsvalue)) {
        query.query.bool.should.push(makeMatchQuery(paramsQuery.newsvalue, 'document.meta.core_newsvalue.value'))
      } else {
        query.query.bool.must.push(makeMatchQuery(paramsQuery.newsvalue, 'document.meta.core_newsvalue.value'))
      }
    }

    if (paramsQuery?.aType) {
      if (Array.isArray(paramsQuery.aType)) {
        query.query.bool.should.push(makeMatchQuery(paramsQuery?.aType, 'document.meta.core_assignment.meta.core_assignment_type.value'))
      } else {
        query.query.bool.must.push(makeMatchQuery(paramsQuery?.aType, 'document.meta.core_assignment.meta.core_assignment_type.value'))
      }
    }
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
