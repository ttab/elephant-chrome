import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useRegistry } from '@/hooks/useRegistry'
import type { SWRResponse } from 'swr'
import type { Document } from '@ttab/elephant-api/newsdoc'

export const useLayouts = (
  documentId: string
): SWRResponse<Document | undefined, Error> => {
  const { data: session } = useSession()
  const { repository } = useRegistry()

  return useSWR<Document | undefined, Error>(documentId, async () => {
    if (!session) {
      throw new Error('Fetching tt/print-layout: Session is missing')
    }

    if (!documentId) {
      throw new Error('Fetching tt/print-layout: documentId is missing')
    }

    const doc = await repository?.getDocument({
      uuid: documentId,
      accessToken: (session as { accessToken: string })?.accessToken
    })

    if (!doc) {
      throw new Error('Document not found')
    }

    return doc.document
  })
}
