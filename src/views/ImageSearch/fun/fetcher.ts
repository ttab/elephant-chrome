import apiClient from '@/lib/apiClient'
import { type ttninjs, type facet } from '@ttab/api-client'

export const fetcher = async ([queryString, index, SIZE]: [queryString: string, index: number, SIZE: number]): Promise<{
  hits: ttninjs[]
  total: number
  facets?: {
    'subject.code'?: facet[]
    'product.code'?: facet[]
    'place.name'?: facet[]
    'person.name'?: facet[]
    copyrightholder?: facet[]
  }
}> => {
  const client = await apiClient(undefined, undefined)
  const res = await client.content.search('image', { q: queryString, s: SIZE, fr: (index) * SIZE })
  return res
}
