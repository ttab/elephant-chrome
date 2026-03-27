import type { Session } from 'next-auth'
import { getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Wire } from '@/shared/schemas/wire'
import { toast } from 'sonner'
import { ToastAction } from '@/components/ToastAction'
import { CalendarDaysIcon, FileInputIcon } from '@ttab/elephant-ui/icons'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { removeAssignmentWithDeliverable } from '@/lib/index/removeAssignment'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import i18n from '@/lib/i18n'

export async function createArticle({
  ydoc,
  status,
  wires,
  planningId,
  planningTitle,
  newsvalue,
  section,
  timeZone
}: {
  ydoc: YDocument<Y.Map<unknown>>
  status: string
  session: Session
  wires?: Wire[]
  planningId?: string
  planningTitle?: string
  newsvalue?: string
  section: {
    uuid: string
    title: string
  }
  timeZone: string
}): Promise<void> {
  const [documentId] = getValueByYPath<string>(ydoc.ele, 'root.uuid')

  if (!ydoc.connected || status !== 'authenticated' || !ydoc.id) {
    console.error(`Failed adding new wire article ${ydoc.id} to a planning`)
    toast.error(i18n.t('wires:creation.createError2'))
    return
  }

  // Capture Y.Doc reference synchronously before any await — the provider
  // may be disconnected by the time async operations complete (dialog closes
  // and unmounts the component, triggering CollaborationClientRegistry cleanup)
  const yjsDocument = ydoc.provider?.document

  // Create and collect all base data for the assignment
  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  const [assignmentTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')
  const [assignmentSlugline] = getValueByYPath<string>(ydoc.ele, 'meta.tt/slugline[0].value')
  const [ydocNewsValue] = getValueByYPath<string>(ydoc.ele, 'meta.core/newsvalue[0].value')
  const resolvedNewsValue = newsvalue ?? ydocNewsValue

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    planningTitle,
    type: 'text',
    deliverableId: ydoc.id,
    title: assignmentTitle || '',
    slugline: assignmentSlugline,
    priority: resolvedNewsValue ? parseInt(resolvedNewsValue) : undefined,
    publicVisibility: false,
    localDate,
    isoDateTime,
    section,
    wires
  })

  if (!updatedPlanningId) {
    throw new Error('CreateAssignmentError')
  }

  // Set section on the article document. This is the authoritative write — it
  // covers both cases: new planning (Section component may have already written
  // it) and existing planning (Section component is not rendered).
  setValueByYPath(ydoc.ele, 'links.core/section[0]', Block.create({
    type: 'core/section',
    rel: 'section',
    uuid: section.uuid,
    title: section.title
  }))

  // Explicitly save article to repository via HTTP — works even if the
  // Hocuspocus provider has been disconnected (dialog closed before this point)
  try {
    await snapshotDocument(ydoc.id, { status: 'draft' }, yjsDocument)
  } catch (ex) {
    // Roll back the assignment that was just added to the planning
    try {
      await removeAssignmentWithDeliverable(updatedPlanningId, ydoc.id, 'core/article')
    } catch (rollbackEx) {
      console.error('Failed to roll back assignment after article snapshot failure', rollbackEx)
      throw new Error('AssignmentRollbackError')
    }
    throw ex
  }

  toast.success(i18n.t('wires:creation.articleCreated'), {
    duration: 8000,
    classNames: {
      title: 'whitespace-nowrap'
    },
    action: (
      <div className='flex w-full gap-1 justify-end [&>*]:w-auto'>
        <ToastAction
          documentId={updatedPlanningId}
          withView='Planning'
          Icon={CalendarDaysIcon}
          label={i18n.t('wires:toast.openPlanning')}
          target='last'
        />
        <ToastAction
          documentId={documentId}
          planningId={updatedPlanningId}
          withView='Editor'
          Icon={FileInputIcon}
          label={i18n.t('wires:toast.openArticle')}
          target='last'
        />
      </div>
    )
  })
}
