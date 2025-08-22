import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { toast } from 'sonner'
import { ToastAction } from '@/components/ToastAction'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { createStateless, StatelessType } from '@/shared/stateless'
import { CalendarDays, Zap } from '@ttab/elephant-ui/icons'

export type CreateFlashDocumentStatus = 'usable' | 'done' | undefined
export async function createFlash({
  flashProvider,
  status,
  session,
  planningId,
  timeZone,
  documentStatus,
  section,
  startDate
}: {
  flashProvider: HocuspocusProvider
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
  const flashEle = flashProvider.document.getMap('ele')
  const [documentId] = getValueByYPath<string>(flashEle, 'root.uuid')

  if (!flashProvider || status !== 'authenticated' || !documentId) {
    console.error(`Failed adding flash ${documentId} to a planning`)
    toast.error('Kunde inte lägga flashen till en planering', {
      action: (
        <ToastAction actions={[{
          label: 'Öppna flash',
          view: 'Flash',
          props: { id: documentId },
          icon: Zap
        }]}
        />
      )
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
    deliverableId: documentId,
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
      action: (
        <ToastAction actions={[{
          label: 'Öppna flash',
          view: 'Flash',
          props: { id: documentId },
          icon: Zap
        }]}
        />
      )
    })
  } else {
    toast.success(getLabel(documentStatus), {
      action: (
        <ToastAction actions={[
          {
            label: 'Öppna planering',
            view: 'Planning',
            props: { id: updatedPlanningId },
            icon: CalendarDays
          },
          {
            label: 'Öppna flash',
            view: 'Flash',
            props: { id: documentId },
            icon: Zap
          }
        ]}
        />
      )
    })
  }
}
