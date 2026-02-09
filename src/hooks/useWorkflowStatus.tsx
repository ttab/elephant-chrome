import { useSession } from 'next-auth/react'
import type { KeyedMutator } from 'swr'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback, useMemo } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { toast } from 'sonner'
import type { Repository, Status } from '@/shared/Repository'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'
import type { Session } from 'next-auth'
import { WorkflowSpecifications } from '@/defaults/workflowSpecification'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export const useWorkflowStatus = ({ ydoc, documentId: docId }: {
  ydoc?: YDocument<Y.Map<unknown>>
  documentId?: string
}): [
  Status | undefined,
  (newStatusName: string | Status, cause?: string, asWire?: boolean) => Promise<void>,
  KeyedMutator<Status | undefined>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation('shared')

  const documentId = docId || ydoc?.id

  const CACHE_KEY = useMemo(
    () => `status/${documentId}`,
    [documentId])
  /**
   * SWR callback that fetches current workflow status
   */
  const { data: documentStatus, error, mutate } = useSWR<Status | undefined, Error>(
    (documentId && session && repository) ? [CACHE_KEY] : null,
    async () => {
      // Dont try to fetch if document is inProgress
      if (!session || !repository || !documentId) {
        return
      }

      const { meta } = await repository.getMeta({ uuid: documentId, accessToken: session.accessToken }) || {}

      if (!meta) {
        return
      }

      // Determine workflow from meta
      const state = meta.workflowCheckpoint || meta.workflowState

      // Read isWorkflow from specifications
      try {
        const isWorkflow = meta.type === 'tt/wire'
          ? false
          : !!WorkflowSpecifications[meta.type][state]?.isWorkflow

        return {
          uuid: documentId,
          type: meta.type,
          ...getStatusFromMeta(meta, isWorkflow)
        }
      } catch (err) {
        console.error('Failed to get workflow specifications for type:', meta.type, 'state:', state, err, ydoc?.id, documentId)
      }
    }
  )

  if (error) {
    console.error('Unable to get documentStatus', error)
    toast.error(t('errors.fetchStatusFailed'))
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
    if (event.uuid === documentId || event.mainDocument === documentId) {
      void mutate()
    }
  })

  /**
   * Callback hook to update the workflow status of a document
   */
  const setDocumentStatus = useCallback(
    async (newStatus: string | Status, cause?: string, asWire?: boolean) => {
      const uuid = typeof newStatus === 'object' ? newStatus.uuid : documentId

      if (!session || !uuid) {
        toast.error(t('errors.couldNotChangeStatusReloadBrowser'))
        return
      }

      try {
        // Handle wire status updates
        if (asWire && typeof newStatus === 'object' && repository) {
          await setWireStatus(newStatus, repository, session, t)

          return
        }

        // Flush document to repository and if applicable, update the status with cause
        await snapshotDocument(uuid, {
          force: true,
          status: typeof newStatus === 'string'
            ? newStatus
            : newStatus.name,
          cause
        }, ydoc?.provider?.document)

        // Revalidate after the mutation completes
        await globalMutate([CACHE_KEY])
      } catch (ex) {
        toast.error(ex instanceof Error ? ex.message : t('errors.couldNotChangeStatus'))
      }
    },
    [session, documentId, ydoc?.provider?.document, repository, CACHE_KEY]
  )

  return [documentStatus, setDocumentStatus, mutate]
}

async function setWireStatus(newStatus: Status, repository: Repository, session: Session, t: TFunction<string>) {
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
    toast.error(t('errors.couldNotSaveStatus'))
  }
}
