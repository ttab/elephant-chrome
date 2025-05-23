import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { toast } from 'sonner'
import { ToastAction } from '../ToastAction'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { createStateless, StatelessType } from '@/shared/stateless'

export type CreateFlashDocumentStatus = 'usable' | 'done' | undefined
export async function createFlash({
  flashProvider,
  status,
  session,
  planningId,
  timeZone,
  documentStatus
}: {
  flashProvider: HocuspocusProvider
  status: string
  session: Session
  planningId?: string
  timeZone: string
  documentStatus: CreateFlashDocumentStatus

}): Promise<void> {
  const flashEle = flashProvider.document.getMap('ele')
  const [documentId] = getValueByYPath<string>(flashEle, 'root.uuid')

  if (!flashProvider || status !== 'authenticated' || !documentId) {
    console.error(`Failed adding flash ${documentId} to a planning`)
    toast.error('Kunde inte lägga flashen till en planering', {
      action: <ToastAction flashId={documentId} />
    })
    return
  }

  // Trigger the creation of the flash in the repository
  flashProvider.sendStateless(
    createStateless(StatelessType.IN_PROGRESS, {
      state: false,
      status: documentStatus,
      id: documentId,
      context: {
        agent: 'server',
        accessToken: session.accessToken,
        user: session.user,
        type: 'Flash'
      }
    })
  )

  // Create and collect all base data for the assignment
  const [flashTitle] = getValueByYPath<string>(flashEle, 'root.title')
  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  const publishTime = new Date().toISOString()

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    type: 'flash',
    deliverableId: documentId,
    title: flashTitle || 'Ny flash',
    priority: 5,
    publicVisibility: false,
    localDate,
    isoDateTime,
    publishTime
  })

  const getLabel = (documentStatus: CreateFlashDocumentStatus): string => {
    switch (documentStatus) {
      case 'usable': {
        return 'Flash skickad'
      }
      case 'done': {
        return 'Flash godkänd'
      }
      default: {
        return 'Flash sparad'
      }
    }
  }

  if (!updatedPlanningId) {
    toast.error('Flashen har skapats. Tyvärr misslyckades det att koppla den till en planering. Kontakta support för mer hjälp.', {
      action: <ToastAction planningId={updatedPlanningId} flashId={documentId} />
    })
  } else {
    toast.success(getLabel(documentStatus), {
      action: <ToastAction planningId={updatedPlanningId} flashId={documentId} />
    })
  }
}
