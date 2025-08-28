import { useSession } from 'next-auth/react'
import type { KeyedMutator } from 'swr'
import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'
import { useCollaboration, useRegistry, useYValue } from '@/hooks'
import { toast } from 'sonner'
import type { Repository, Status } from '@/shared/Repository'
import { flushDocument } from '@/lib/flushDocument'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'
import type { Session } from 'next-auth'

export const useWorkflowStatus = (uuid?: string, isWorkflow: boolean = false): [
  Status | undefined,
  (newStatusName: string | Status, cause?: string, asWire?: boolean) => Promise<void>,
  KeyedMutator<Status | undefined>
] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { provider } = useCollaboration()
  const [, setChanged] = useYValue('root.changed')

  /**
   * SWR callback that fetches current workflow status
   */
  const { data: documentStatus, error, mutate } = useSWR<Status | undefined, Error>(
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
    async (newStatus: string | Status, cause?: string, asWire?: boolean) => {
      if (!session) {
        toast.error('Ett fel har uppstått, aktuell status kunde inte ändras! Ladda om webbläsaren och försök igen.')
        return
      }

      // Handle wire status updates
      if (asWire && typeof newStatus === 'object' && repository) {
        void setWireStatus(newStatus, repository, session)
        return
      }


      // Flush document to repsitory and if applicable, update the status with cause
      const snapshotResponse = uuid && await flushDocument(uuid, {
        force: true,
        status: typeof newStatus === 'string'
          ? newStatus
          : newStatus.name,
        cause
      }, provider?.document)

      if (snapshotResponse && 'statusCode' in snapshotResponse && snapshotResponse.statusCode !== 200) {
        toast.error(`Ett fel uppstod när aktuell status skulle ändras: ${snapshotResponse.statusMessage || 'Okänt fel'}`)
        return
      }


      // Reset unsaved changes state
      setChanged(undefined)

      // Revalidate after the mutation completes
      await globalMutate([`status/${uuid}`])
    },
    [session, uuid, setChanged, provider?.document, repository]
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
