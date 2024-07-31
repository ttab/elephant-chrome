import { type ttninjs, type facet } from '@ttab/api-client'
import { Api } from '@ttab/api-client'

async function apiClient(token: string, host: URL): Promise<Api> {
  const client = new Api({ host: host.origin, token, timeout: 6000 })
  return client
}

export const createFetcher = (url: URL) =>
  async ([queryString, index, SIZE]: [queryString: string, index: number, SIZE: number]): Promise<{
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
    const client = await apiClient('', url)
    return await client.content.search('image', { q: queryString, s: SIZE, fr: (index) * SIZE })
  }
