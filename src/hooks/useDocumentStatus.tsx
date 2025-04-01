import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { useCollaboration, useRegistry } from '@/hooks'

export interface Status {
  name: string
  version: bigint
  uuid: string
}

export const useDocumentStatus = (uuid?: string): [
  Status | undefined,
  (newStatusName: string | Status) => Promise<void>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { provider } = useCollaboration()

  const doFetch = uuid && session && repository

  const { data: documentStatus, mutate, error } = useSWR<Status | undefined, Error>(
    doFetch ? [`status/${uuid}`] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (!session || !repository || !uuid) return undefined

      const result = await repository.getMeta({ uuid, accessToken: session.accessToken })
      if (!result) {
        return undefined
      }

      const version = result?.meta?.currentVersion || 0n
      const heads = result?.meta?.heads
      const headsEntries = heads ? Object.entries(heads) : []

      if (!headsEntries.length) {
        return {
          version,
          name: 'draft',
          uuid
        }
      }

      // Get statuses for the current version and sort them by creation date
      const currentStatus = headsEntries
        .filter(([_, data]) => data.version === version)
        .sort((a, b) => new Date(b[1].created).getTime() - new Date(a[1].created).getTime())?.[0]?.[0] || 'draft'

      return {
        version,
        name: currentStatus,
        uuid
      }
    }
  )

  if (error) console.error('Unable to get documentStatus', error)

  const setDocumentStatus = useCallback(
    async (newStatus: string | Status) => {
      if (!session || !repository || !uuid || !provider?.document) {
        return
      }

      // Ensure we always work with the latest status
      const currentStatus = documentStatus || (await globalMutate([`status/${uuid}`], undefined, false))
      if (!currentStatus) {
        throw new Error('Cannot update status: No current status available')
      }

      const payload: Status = typeof newStatus === 'string'
        ? { ...currentStatus, name: newStatus }
        : newStatus

      // Optimistically update the SWR cache before performing the actual API call
      await mutate(payload, false)

      try {
        await repository.saveMeta({
          status: payload,
          currentStatus,
          accessToken: session.accessToken
        })

        // Revalidate after the mutation completes
        await globalMutate([`status/${uuid}`])
      } catch (error) {
        console.error('Failed to update status', error)
        // Rollback the optimistic update if the ststus update fails
        await mutate(currentStatus, false)
      }
    },
    [session, uuid, documentStatus, mutate, repository, provider?.document]
  )

  return [documentStatus, setDocumentStatus]
}
