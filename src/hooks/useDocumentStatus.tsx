import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { Repository } from '@/lib/repository'
import { type MetaHead } from '@/lib/repository/metaSearch'
import { useRegistry } from '@/hooks'

interface Status {
  name: string
  version: number
  documentId: string
}

type UseDocumentStatusReturn = [Status | undefined, (newStatusName: string) => Promise<void>]

export const useDocumentStatus = (documentId?: string): UseDocumentStatusReturn => {
  const { server: { repositoryUrl } } = useRegistry()
  const { data: session } = useSession()

  const { data: documentStatus, mutate } = useSWR(
    documentId ? [`status/${documentId}`] : null,
    async () => {
      if (!session || !repositoryUrl || !documentId) return undefined

      const _meta = await Repository.metaSearch({ session, documentId, repositoryUrl })
      const version = _meta.meta.current_version
      const heads: MetaHead = _meta?.meta?.heads
      const headsEntries = Object.entries(heads)
      const currentStatus = headsEntries.sort((a, b) => a[1].created > b[1].created ? -1 : 0)[0][0]

      return {
        version: +version,
        name: currentStatus,
        documentId
      }
    }
  )

  const setDocumentStatus = useCallback(
    async (newStatusName: string) => {
      if (!session || !documentId || !documentStatus) return

      const newStatus = {
        ...documentStatus,
        name: newStatusName
      }

      // Optimistically update the SWR cache before performing the actual API call
      await mutate(newStatus, false)

      try {
        await Repository.update({ session, status: newStatus })
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
