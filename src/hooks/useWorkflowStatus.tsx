import { useSession } from 'next-auth/react'
import type { KeyedMutator } from 'swr'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback, useMemo } from 'react'
import { useCollaboration, useRegistry, useRepositoryEvents, useYValue } from '@/hooks'
import { toast } from 'sonner'
import type { Repository, Status } from '@/shared/Repository'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'
import type { Session } from 'next-auth'

// TODO: rename asPrint to a more generic name.
// "asPrint" chould probably be used for planning-items and events as well
export const useWorkflowStatus = (uuid?: string, isWorkflow: boolean = false, asPrint?: boolean): [
  Status | undefined,
  (newStatusName: string | Status, cause?: string, asWire?: boolean) => Promise<void>,
  KeyedMutator<Status | undefined>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { provider } = useCollaboration()
  const [, setChanged] = useYValue('root.changed')

  const CACHE_KEY = useMemo(
    () => `status/${uuid}/${isWorkflow}`,
    [uuid, isWorkflow])
  /**
   * SWR callback that fetches current workflow status
   */
  const { data: documentStatus, error, mutate } = useSWR<Status | undefined, Error>(
    (uuid && session && repository) ? [CACHE_KEY] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (!session || !repository || !uuid) {
        return
      }

      const { meta } = await repository.getMeta({ uuid, accessToken: session.accessToken }) || {}

      if (!meta) {
        return
      }

      if (asPrint && meta.workflowCheckpoint === 'usable') {
        return {
          uuid,
          ...getStatusFromMeta(meta, false)
        }
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

  // Listen to repository events and revalidate if the current document is affected
  useRepositoryEvents([
    'core/article',
    'core/article+meta',
    'core/flash',
    'core/flash+meta',
    'core/editorial-info',
    'core/editorial-info+meta',
    'tt/print-article',
    'tt/print-article+meta',
    'core/planning-item',
    'core/planning-item+meta'

  ], (event) => {
    if (event.uuid === uuid || event.mainDocument === uuid) {
      void mutate()
    }
  })


  /**
   * Callback hook to update the workflow status of a document
   */
  const setDocumentStatus = useCallback(
    async (newStatus: string | Status, cause?: string, asWire?: boolean) => {
      if (!session || !uuid) {
        toast.error('Ett fel har uppstått, aktuell status kunde inte ändras! Ladda om webbläsaren och försök igen.')
        return
      }

      try {
        // Handle wire status updates
        if (asWire && typeof newStatus === 'object' && repository) {
          await setWireStatus(newStatus, repository, session)

          return
        }

        // Flush document to repository and if applicable, update the status with cause
        await snapshotDocument(uuid, {
          force: true,
          status: typeof newStatus === 'string'
            ? newStatus
            : newStatus.name,
          cause
        }, provider?.document)

        // Reset unsaved changes state
        setChanged(undefined)

        // Revalidate after the mutation completes
        await globalMutate([CACHE_KEY])
      } catch (ex) {
        toast.error(ex instanceof Error ? ex.message : 'Ett fel uppstod när aktuell status skulle ändras')
      }
    },
    [session, uuid, setChanged, provider?.document, repository, CACHE_KEY]
  )

  return [documentStatus, setDocumentStatus, mutate]
}

async function setWireStatus(newStatus: Status, repository: Repository, session: Session) {
  try {
    if (!repository || !session.accessToken) {
      throw new Error('Repository or session access token is not available')
    }

    await repository.saveMeta({
      status: newStatus,
      currentStatus: undefined,
      accessToken: session.accessToken
    })
  } catch (error) {
    console.error('Failed to set wire status', error)
    toast.error('Ett fel uppstod när aktuell status skulle sparas')
  }
}
