import { type ttninjs, type facet } from '@ttab/api-client'
import { Api } from '@ttab/api-client'
import type { Session } from 'next-auth'
import { toast } from 'sonner'
import { productCodes } from './productCodes'
import type { MediaTypes } from '..'

function apiClient(token: string, host: URL): Api {
  const client = new Api({ host: host.origin, token, timeout: 6000 })
  return client
}

export const createFetcher = (url: URL, session: Session | null, mediaType: MediaTypes) =>
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
    if (!session) {
      toast.error('Kan inte autentisera mot bildtjänsten')
      throw new Error('ImageSearch Error: No session for user')
    }
    const client = apiClient(session.accessToken, url)
    return await client.content.search(mediaType, {
      sort: 'default:desc',
      p: productCodes,
      q: queryString,
      pubstatus: ['usable', 'commissioned'],
      s: SIZE,
      fr: (index) * SIZE
    })
  }
