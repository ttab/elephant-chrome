import { searchIndex, type SearchIndexResponse } from './searchIndex'
import { type Factbox as FactboxSchema } from '@/lib/index/schemas/factbox'


interface SearchFactboxParams {
  size?: number
  query: object
}

const search = async (endpoint: URL, accessToken: string, params: SearchFactboxParams): Promise<SearchIndexResponse<FactboxSchema>> => {
  const query = params.query

  return await searchIndex(
    query,
    {
      index: 'core_factbox',
      endpoint,
      accessToken
    }
  )
}

export const Factbox = {
  search
}
