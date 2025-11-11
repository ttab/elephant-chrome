import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { toast } from 'sonner'
import { ToastAction } from '../ToastAction'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export type CreateFlashDocumentStatus = 'usable' | 'done' | undefined
export async function createFlash({
  ydoc,
  status,
  planningId,
  timeZone,
  documentStatus,
  section,
  startDate
}: {
  ydoc: YDocument<Y.Map<unknown>>
  status: string
  session: Session
  planningId?: string
  timeZone: string
  documentStatus: CreateFlashDocumentStatus
  section?: {
    uuid: string
    title: string
  }
  startDate?: string
}): Promise<void> {
  if (!ydoc || status !== 'authenticated') {
    console.error(`Failed adding flash ${ydoc.id} to a planning`)
    toast.error('Kunde inte lägga flashen till en planering', {
      action: <ToastAction flashId={ydoc.id} />
    })
    return
  }

  // Trigger the creation of the flash in the repository
  await snapshotDocument(ydoc.id, {
    status: documentStatus
  }, ydoc.provider?.document)
    .catch((ex) => {
      toast.error('Kunde inte spara flash')
      console.error('Failed creating flash snapshot', ex)
    })

  // Create and collect all base data for the assignment
  const [flashTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')
  const dt = new Date()
  let localDate: string
  let isoDateTime: string

  if (startDate) {
    // Use provided start date
    const date = startDate.split('T')[0]
    localDate = date
    const currentTime = new Date().toISOString().split('T')[1].split('.')[0] + 'Z'
    isoDateTime = `${date}T${currentTime}`
  } else {
    // create new date
    isoDateTime = `${new Date().toISOString().split('.')[0]}Z`
    localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  }

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    type: 'flash',
    deliverableId: ydoc.id,
    title: flashTitle || 'Ny flash',
    priority: 5,
    publicVisibility: false,
    localDate,
    isoDateTime,
    section
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
      action: <ToastAction planningId={updatedPlanningId} flashId={ydoc.id} />
    })
  } else {
    toast.success(getLabel(documentStatus), {
      action: <ToastAction planningId={updatedPlanningId} flashId={ydoc.id} />
    })
  }
}
