import { Repository } from '@/shared/Repository'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import type { SWRResponse } from 'swr'

const REPOSITORY_URL = process.env.REPOSITORY_URL || ''

/**
 * Custom hook to manage a boolean toggle state.
 *
 * @param initialState - The initial state of the toggle.
 * @returns An array containing the current state and a function to toggle the state.
 *
 * @example
 * const [isToggled, toggle] = useToggle(false);
 */

export const useLayouts = (
  documentId: string
): SWRResponse => {
  const { data: session } = useSession()
  const repository = new Repository(REPOSITORY_URL)

  return useSWR(documentId, async () => {
    if (!session) {
      return Promise.reject(new Error('Fetching PrintFlow: Session is missing'))
    }

    if (!documentId) {
      return Promise.reject(new Error('Fetching PrintFlow: documentId is missing'))
    }

    try {
      return await repository.getDocument({
        uuid: documentId,
        accessToken: (session as { accessToken: string })?.accessToken
      })
        .then((doc) => {
          if (!doc) {
            return {
              statusCode: 404,
              statusMessage: 'Not found'
            }
          }
          const layouts = doc.document?.meta?.find((m) => m.type === 'tt/print-article')?.meta?.filter((m) => m.type === 'tt/article-layout') || []
          return layouts
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
