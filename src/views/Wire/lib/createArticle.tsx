import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import type { Wire } from '@/shared/schemas/wire'
import { toast } from 'sonner'
import { ToastAction } from '../ToastAction'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { CalendarDaysIcon, FileInputIcon } from '@ttab/elephant-ui/icons'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export async function createArticle({
  ydoc,
  status,
  wire,
  planningId,
  planningTitle,
  section,
  timeZone
}: {
  ydoc: YDocument<Y.Map<unknown>>
  status: string
  session: Session
  wire?: Wire
  planningId?: string
  planningTitle?: string
  section?: {
    uuid: string
    title: string
  }
  timeZone: string
}): Promise<void> {
  const [documentId] = getValueByYPath<string>(ydoc.ele, 'root.uuid')

  if (!ydoc.connected || status !== 'authenticated' || !ydoc.id) {
    console.error(`Failed adding new wire article ${ydoc.id} to a planning`)
    toast.error('Kunde inte skapa ny artikel!')
    return
  }

  // Create and collect all base data for the assignment
  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  const [assignmentTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')
  const [assignmentSlugline] = getValueByYPath<string>(ydoc.ele, 'meta.tt/slugline[0].value')
  const [newsValue] = getValueByYPath<string>(ydoc.ele, 'meta.core/newsvalue[0].value')

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    planningTitle,
    type: 'text',
    deliverableId: ydoc.id,
    title: assignmentTitle || '',
    slugline: assignmentSlugline,
    priority: newsValue ? parseInt(newsValue) : undefined,
    publicVisibility: false,
    localDate,
    isoDateTime,
    section,
    wire
  })

  // Create article in repo
  if (ydoc.isInProgress) {
    ydoc.setIsInProgress(false)
  }

  toast.success(`Artikel skapad`, {
    action: [
      <ToastAction
        key='open-planning'
        documentId={updatedPlanningId}
        withView='Planning'
        label='Öppna planering'
        Icon={CalendarDaysIcon}
        target='last'
      />,

      <ToastAction
        key='open-article'
        documentId={documentId}
        withView='Editor'
        label='Öppna artikel'
        Icon={FileInputIcon}
        target='last'
      />
    ]
  })
}
