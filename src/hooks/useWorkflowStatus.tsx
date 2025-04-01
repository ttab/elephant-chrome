import { useSession } from 'next-auth/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { useCollaboration, useRegistry } from '@/hooks'
import { toast } from 'sonner'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'

export interface Status {
  uuid: string
  version: bigint
  name: string
  checkpoint?: string
}

export const useWorkflowStatus = (uuid?: string): [
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
      if (meta) {
        return {
          uuid,
          version: meta.currentVersion || 1n,
          name: meta.workflowState || 'draft',
          checkpoint: meta.workflowCheckpoint
        }
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
      if (!session || !repository || !uuid || !provider?.document) {
        toast.error('Ett fel har uppstått och aktuell status kunde inte ändras!')
        return
      }

      // Ensure we always work with the latest status
      const currentStatus = documentStatus || (await globalMutate([`status/${uuid}`], undefined, false))
      if (!currentStatus) {
        toast.error('Ett fel har uppstått och aktuell status kunde inte ändras!')
        return
      }

      const payload: Status = (typeof newStatus === 'string')
        ? { ...currentStatus, name: newStatus }
        : newStatus

      // Optimistically update the SWR cache before performing the actual API call
      await mutate(payload, false)

      // Change status of document in repository
      try {
        if (newStatus === 'draft' && ['usable', 'withheld', 'unpublished'].includes(currentStatus.name)) {
          const { documentResponse } = fromYjsNewsDoc(provider.document)
          const { document } = fromGroupedNewsDoc(documentResponse)
          await repository.saveDocument(document, session.accessToken, payload.version, undefined)
        } else {
          // If there is a previous checkpoint (published/scheduled/unpublished version) we require a cause to publish a new version
          if (currentStatus.checkpoint
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
            currentStatus,
            accessToken: session.accessToken,
            cause
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
    [session, uuid, documentStatus, mutate, repository, provider?.document]
  )

  return [documentStatus, setDocumentStatus]
}
