import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useRegistry } from '@/hooks/useRegistry'
import type { SWRResponse } from 'swr'
import type { GetDocumentResponse } from '@ttab/elephant-api/repository'

/**
 * Custom hook to fetch layouts associated with a specific document.
 *
 * This hook utilizes SWR for data fetching and caching. It requires a valid session
 * and a document ID to retrieve the layouts. If the session or document ID is missing,
 * it will reject the promise with an appropriate error message.
 *
 * @param documentId - The unique identifier of the document for which layouts are to be fetched.
 * @returns - The response object from SWR containing the data, error, and other properties.
 *
 * @throws Will throw an error if the session is missing or if the document ID is not provided.
 *
 * @example
 * const { data, error } = useLayouts('document-uuid');
 * if (error) {
 *   console.error('Error fetching layouts:', error);
 * } else {
 *   console.log('Layouts:', data);
 * }
 */

export const useLayouts = (
  documentId: string
): SWRResponse => {
  const { data: session } = useSession()
  const { repository } = useRegistry()
  return useSWR(documentId, async () => {
    if (!session) {
      return Promise.reject(new Error('Fetching PrintFlow: Session is missing'))
    }

    if (!documentId) {
      return Promise.reject(new Error('Fetching PrintFlow: documentId is missing'))
    }

    try {
      return await repository?.getDocument({
        uuid: documentId,
        accessToken: (session as { accessToken: string })?.accessToken
      })
        .then((doc: GetDocumentResponse | null) => {
          if (!doc) {
            return {
              statusCode: 404,
              statusMessage: 'Not found'
            }
          }
          const layouts = doc.document?.meta?.find((m) => m.type === 'tt/print-article')?.meta?.filter((m) => m.type === 'tt/article-layout') || []
          return { layouts, document: doc.document }
        })
        .catch(() => {
          return {
            statusCode: 404,
            statusMessage: 'Not found'
          }
        })
    } catch (ex) {
      if (ex instanceof Error) {
        return Promise.reject(ex)
      }

      return Promise.reject(new Error('Fetching PrintFlow: An unknown error occurred'))
    }
  })
}
