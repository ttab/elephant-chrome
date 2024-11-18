import { type Wire } from './schemas/wire'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

export interface WireSearchParams {
  page?: number
  size?: number
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
  source?: string
}

const search = async (endpoint: URL, accessToken: string, params?: WireSearchParams): Promise<SearchIndexResponse<Wire>> => {
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  if (params?.sort?.start && ['asc', 'desc'].includes(params.sort.start)) {
    sort.push({ 'document.meta.core_assignment.data.start': params.sort.start })
  }

  if (params?.sort?.end) {
    sort.push({ 'document.meta.core_assignment.data.end': params.sort.end })
  }

  sort.push({ created: 'desc' })

  const sourceQuery = {
    bool: {
      must: [{
        term: {
          'document.rel.source.uri': params?.source || '*'
        }
      }]
    }
  }

  const query = {
    query: params?.source ? sourceQuery : { match_all: {} },
    _source: true,
    fields: [
      'document.title',
      'heads.usable.*'
    ],
    sort
  }

  return await searchIndex(
    query,
    {
      index: 'tt_wire',
      endpoint,
      accessToken
    },
    params?.page,
    params?.size
  )
}

export const Wires = {
  search
}
