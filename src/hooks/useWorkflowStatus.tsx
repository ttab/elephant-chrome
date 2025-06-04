import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { useRegistry, useYValue } from '@/hooks'
import { toast } from 'sonner'
import type { Status } from '@/shared/Repository'
import { snapshot } from '@/lib/snapshot'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'

export const useWorkflowStatus = (uuid?: string, isWorkflow: boolean = false): [
  Status | undefined,
  (newStatusName: string | Status, cause?: string) => Promise<void>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [, setChanged] = useYValue('root.changed')

  /**
   * SWR callback that fetches current workflow status
   */
  const { data: documentStatus, mutate, error } = useSWR<Status | undefined, Error>(
    (uuid && session && repository) ? [`status/${uuid}`] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (!session || !repository || !uuid) {
        return
      }

      const { meta } = await repository.getMeta({ uuid, accessToken: session.accessToken }) || {}

      if (!meta) {
        return
      }

      return {
        uuid,
        ...getStatusFromMeta(meta, isWorkflow)
      }
    }
  )


  if (error) {
    console.error('Unable to get documentStatus', error)
    toast.error('Ett fel uppstod när aktuell status skulle hämtas. Försök ladda om sidan.')
  }


  /**
   * Callback hook to update the workflow status of a document
   */
  const setDocumentStatus = useCallback(
    async (newStatus: string | Status, cause?: string) => {
      if (!session || !repository) {
        toast.error('Ett fel har uppstått, aktuell status kunde inte ändras! Ladda om webbläsaren och försök igen.')
        return
      }

      // Work with the latest status if possible
      const currentStatus = documentStatus || await globalMutate([`status/${uuid}`], undefined, false)

      // Snapshot document to make sure we have the latest version, get the new version from the response
      const snapshotResponse = uuid && await snapshot(uuid, true)

      if (snapshotResponse && 'statusCode' in snapshotResponse && snapshotResponse.statusCode !== 200) {
        toast.error(`Ett fel uppstod när aktuell status skulle ändras: ${snapshotResponse.statusMessage || 'Okänt fel'}`)
        return
      }

      const newVersion = snapshotResponse && 'version' in snapshotResponse && typeof snapshotResponse.version === 'string'
        ? BigInt(snapshotResponse.version)
        : documentStatus?.version

      let payload: Status | undefined
      if (typeof newStatus !== 'string') {
        payload = {
          ...newStatus,
          version: newVersion || newStatus.version
        }
      } else if (typeof newStatus === 'string' && documentStatus && uuid) {
        if (!newVersion) {
          console.error('Unable to get current version to update status')
          toast.error('Ett fel har uppstått, aktuell status kunde inte ändras!')
          return
        }

        payload = {
          ...documentStatus,
          uuid,
          name: newStatus,
          version: newVersion
        }
      }

      if (!payload) {
        toast.error('Ett fel uppstod och status kunde inte ändras!')
        return
      }

      // Optimistically update the SWR cache before performing the actual API call
      await mutate(payload, false)

      // Change status of document in repository
      try {
        // If there is a previous checkpoint (published/scheduled/unpublished version) we require a cause to publish a new version
        if (currentStatus?.checkpoint
          && ['usable', 'withheld', 'unpublished'].includes(payload.name)
          && typeof cause !== 'string'
        ) {
          toast.error('En anledning måste ges för att skapa en ny version. Aktuell status kunde inte ändras!')
          return
        }

        await repository.saveMeta({
          status: payload,
          currentStatus: isWorkflow ? currentStatus : undefined,
          accessToken: session.accessToken,
          cause,
          isWorkflow
        })

        // Reset unsaved changes state
        setChanged(undefined)

        // Revalidate after the mutation completes
        await globalMutate([`status/${uuid || payload.uuid}`])
      } catch (error) {
        console.error('Failed to update status', error)
        toast.error('Ett fel uppstod och aktuell status kunde inte ändras!')
        // Rollback the optimistic update if the ststus update fails
        await mutate(currentStatus, false)
      }
    },
    [session, uuid, documentStatus, mutate, repository, isWorkflow, setChanged]
  )

  return [documentStatus, setDocumentStatus]
}
