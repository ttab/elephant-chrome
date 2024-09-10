import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { Repository } from '@/lib/repository'
import { useCollaboration, useRegistry, useYValue } from '@/hooks'

export interface Status {
  name: string
  version: bigint
  documentId: string
}

export const useDocumentStatus = (documentId?: string): [
  Status | undefined,
  (newStatusName: string) => Promise<void>
] => {
  const { server: { repositoryUrl } } = useRegistry()
  const { data: session } = useSession()

  const { synced } = useCollaboration()

  const [inProgress] = useYValue<boolean>('root.__inProgress')


  const { data: documentStatus, mutate, error } = useSWR(
    documentId && synced ? [`status/${documentId}`] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (inProgress || !session || !repositoryUrl || !documentId) return undefined

      const result = await Repository.metaSearch({ session, documentId, repositoryUrl })

      if (!result) return undefined


      const version = result.meta?.current_version || 0n
      const heads = result.meta?.heads

      if (!heads) {
        return {
          version,
          name: 'draft',
          documentId
        }
      }

      const headsEntries = Object.entries(heads || {})
      const currentStatus = headsEntries.sort((a, b) => a[1].created > b[1].created ? -1 : 0)[0][0]

      return {
        version,
        name: currentStatus,
        documentId
      }
    }
  )

  if (error) console.error('Unable to get documentStatus', error)

  const setDocumentStatus = useCallback(
    async (newStatusName: string) => {
      if (!session || !documentId || !documentStatus) return

      const newStatus = {
        ...documentStatus,
        name: newStatusName,
        version: documentStatus.version
      }

      // Optimistically update the SWR cache before performing the actual API call
      await mutate(newStatus, false)

      try {
        await Repository.update({
          session,
          status: {
            ...newStatus
          }
        })

        // Revalidate after the mutation completes
        await globalMutate([`status/${documentId}`])
      } catch (error) {
        console.error('Failed to update status', error)
      }
    },
    [session, documentId, documentStatus, mutate]
  )

  return [documentStatus, setDocumentStatus]
}
