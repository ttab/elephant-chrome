import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { useCollaboration, useRegistry, useYValue } from '@/hooks'

export interface Status {
  name: string
  version: bigint
  uuid: string
}

export const useDocumentStatus = (uuid?: string): [
  Status | undefined,
  (newStatusName: string) => Promise<void>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()

  const { synced } = useCollaboration()

  const [inProgress] = useYValue<boolean>('root.__inProgress')


  const doFetch = uuid && synced && !inProgress && session && repository

  const { data: documentStatus, mutate, error } = useSWR<Status | undefined, Error>(
    doFetch ? [`status/${uuid}`] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (!session || !repository || !uuid) return undefined

      const result = await repository.getMeta({ uuid, accessToken: session.accessToken })

      const version = result?.meta?.currentVersion || 0n
      const heads = result?.meta?.heads

      const headsEntries = heads && Object.entries(heads)

      if (!headsEntries) {
        return {
          version,
          name: 'draft',
          uuid
        }
      }

      const currentStatus = headsEntries
        .sort((a, b) =>
          new Date(b[1].created).getTime() - new Date(a[1].created).getTime())[0][0]

      return {
        version,
        name: currentStatus,
        uuid
      }
    }
  )

  if (error) console.error('Unable to get documentStatus', error)

  const setDocumentStatus = useCallback(
    async (newStatusName: string) => {
      if (!session || !uuid || !documentStatus || !repository) return

      const newStatus = {
        ...documentStatus,
        name: newStatusName,
        version: documentStatus.version
      }

      // Optimistically update the SWR cache before performing the actual API call
      await mutate(newStatus, false)

      try {
        await repository.saveMeta({
          status: newStatus,
          accessToken: session.accessToken
        })

        // Revalidate after the mutation completes
        await globalMutate([`status/${uuid}`])
      } catch (error) {
        console.error('Failed to update status', error)
      }
    },
    [session, uuid, documentStatus, mutate, repository]
  )

  return [documentStatus, setDocumentStatus]
}
