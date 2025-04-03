import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { useCollaboration, useRegistry } from '@/hooks'
import { toast } from 'sonner'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { Status } from '@/shared/Repository'

export const useWorkflowStatus = (uuid?: string, isWorkflow: boolean = false): [
  Status | undefined,
  (newStatusName: string | Status, cause?: string) => Promise<void>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { provider } = useCollaboration()

  /**
   * SWR callback that fetches current workflow status
   */
  const { data: documentStatus, mutate, error } = useSWR<Status | undefined, Error>(
    (uuid && session && repository) ? [`status/${uuid}`] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (!session || !repository || !uuid) {
        return undefined
      }

      const { meta } = await repository.getMeta({ uuid, accessToken: session.accessToken }) || {}
      if (!meta) {
        return
      }

      if (!isWorkflow) {
        const version = meta.currentVersion || 0n
        const headsEntries = meta.heads && Object.entries(meta.heads)
        if (!headsEntries?.length) {
          return {
            uuid,
            version,
            name: 'draft'
          }
        }

        return {
          uuid,
          version,
          name: headsEntries
            .filter((entry) => entry[1].version === version)
            .sort((a, b) =>
              new Date(b[1].created).getTime() - new Date(a[1].created).getTime())?.[0]?.[0] || 'draft'
        }
      }

      return {
        uuid,
        version: meta.currentVersion || 0n,
        name: meta.workflowState || 'draft',
        checkpoint: meta.workflowCheckpoint
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

      let payload: Status | undefined
      if (typeof newStatus !== 'string') {
        payload = newStatus
      } else if (typeof newStatus === 'string' && documentStatus && uuid) {
        payload = {
          ...documentStatus,
          uuid: uuid,
          name: newStatus,
          version: documentStatus?.version
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
        if (provider?.document && currentStatus && newStatus === 'draft' && ['usable', 'unpublished'].includes(currentStatus?.name)) {
          const { documentResponse } = fromYjsNewsDoc(provider.document)
          const { document } = fromGroupedNewsDoc(documentResponse)
          await repository.saveDocument(document, session.accessToken, payload.version, undefined)
        } else {
          // If there is a previous checkpoint (published/scheduled/unpublished version) we require a cause to publish a new version
          if (currentStatus?.checkpoint
            && ['usable', 'withheld', 'unpublished'].includes(payload.name)
            && typeof cause !== 'string'
          ) {
            toast.error('En anledning måste ges för att skapa en ny version. Aktuell status kunde inte ändras!')
            return
          }

          // Unpublishing a document is done by setting version to -1
          if (newStatus === 'unpublished') {
            payload.version = -1n
          }

          await repository.saveMeta({
            status: payload,
            currentStatus: isWorkflow ? currentStatus : undefined,
            accessToken: session.accessToken,
            cause,
            isWorkflow
          })
        }

        // Revalidate after the mutation completes
        await globalMutate([`status/${uuid}`])
      } catch (error) {
        console.error('Failed to update status', error)
        toast.error('Ett fel uppstod och aktuell status kunde inte ändras!')
        // Rollback the optimistic update if the ststus update fails
        await mutate(currentStatus, false)
      }
    },
    [session, uuid, documentStatus, mutate, repository, provider?.document, isWorkflow]
  )

  return [documentStatus, setDocumentStatus]
}
