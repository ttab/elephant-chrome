import type { SWRResponse } from 'swr'
import useSWR from 'swr'
import type { IndexSearchResult } from '@/shared/Index'
import { Index } from '@/shared/Index'
import type { Session } from 'next-auth'

/**
 * Custom hook to fetch print flows using SWR.
 *
 * @param indexUrl - The URL of the index to query. If undefined, no request is made.
 * @param session - The session object containing the access token. If null or undefined, an error is thrown.
 * @returns The SWR response containing the query result or an error.
 *
 * @throws Error If the session is missing or the indexUrl is not provided.
 */
export const useFetchPrintFlows = (
  indexUrl: URL | undefined,
  session: Session | null | undefined
): SWRResponse<IndexSearchResult, Error> => {
  return useSWR(indexUrl?.href, async () => {
    if (!session) {
      return Promise.reject(new Error('Fetching PrintFlow: Session is missing'))
    }

    if (!indexUrl) {
      return Promise.reject(new Error('Fetching PrintFlow: indexUrl is missing'))
    }

    const client = new Index(indexUrl.href)

    try {
      return client.query({
        accessToken: session.accessToken,
        documentType: 'tt/print-flow',
        fields: [
          'document.title',
          'document.content.tt_print_content.name',
          'document.content.tt_print_content.title'
        ]
      })
    } catch (ex) {
      if (ex instanceof Error) {
        return Promise.reject(ex)
      }

      return Promise.reject(new Error('Fetcing PrintFlow: An unknown error occurred'))
    }
  })
}
