import { searchIndex, type SearchIndexResponse } from './searchIndex'
import { type Assignment as AssignmentSchema } from '@/lib/index/schemas/assignment'


interface Params {
  size?: number
  query?: object
  where?: {
    start?: string | Date
    end?: string | Date
  }
}

const search = async (endpoint: URL, accessToken: string, params: Params): Promise<SearchIndexResponse<AssignmentSchema>> => {
  const query = {
    query: {
      match_all: {}
    }
  }

  return await searchIndex(
    query,
    {
      index: 'core_assignment',
      endpoint,
      accessToken
    },
    params.size
  )
}

export const Assignments = {
  search
}
