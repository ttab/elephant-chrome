import { type Wire } from './schemas/wire'
import { searchIndex, type SearchIndexResponse } from './searchIndex'

export interface WireSearchParams {
  page?: number
  size?: number
  sort?: {
    issued?: 'asc' | 'desc'
  }
  source?: string[]
}

const search = async (endpoint: URL, accessToken: string, params?: WireSearchParams): Promise<SearchIndexResponse<Wire>> => {
  const sort: Array<Record<string, 'asc' | 'desc'>> = []

  sort.push({ 'document.meta.tt_wire.data.issued': 'desc' })

  const sourceQuery = {
    bool: {
      must: [{
        terms: {
          'document.rel.source.uri': Array.isArray(params?.source)
            ? params.source
            : [params?.source]
        }
      }]
    }
  }

  const query = {
    query: params?.source?.length ? sourceQuery : { match_all: {} },
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
