import type { Session } from 'next-auth'
import { getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Wire } from '@/shared/schemas/wire'
import type { EleBlock } from '@/shared/types'
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
import type { TBElement } from '@ttab/textbit'
import { toContentYXmlText, translateWireContent } from './translateWireContent'

export async function createArticle({
  ydoc,
  status,
  wires,
  planningId,
  planningTitle,
  newsvalue,
  section,
  timeZone,
  embargoUntil,
  contentSources,
  wireContent,
  translationMode
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
  embargoUntil?: string
  contentSources?: EleBlock[]
  wireContent?: TBElement[]
  translationMode?: 'standard' | 'personal'
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

  // Set wire content on the Y.Doc SYNCHRONOUSLY before any async operations.
  // After the first await, dialog close may unmount the component and disconnect
  // the provider, making ydoc.ele potentially stale. Setting content now ensures
  // it is captured by snapshotDocument even in that case.
  if (wireContent) {
    ydoc.ele.set('content', toContentYXmlText(wireContent))
  }

  // Set section on the article document synchronously as well.
  setValueByYPath(ydoc.ele, 'links.core/section[0]', Block.create({
    type: 'core/section',
    rel: 'section',
    uuid: section.uuid,
    title: section.title
  }))

  // Store embargo on the article's wire link for editor access
  if (embargoUntil) {
    setValueByYPath(ydoc.ele, 'links.tt/wire[0].data.embargo_until', embargoUntil)
  }

  // Replace default content sources with wire-provided ones
  if (contentSources?.length) {
    setValueByYPath(ydoc.ele, 'links.core/content-source', contentSources.map((source) =>
      Block.create({
        type: 'core/content-source',
        uri: source.uri,
        title: source.title,
        rel: source.rel || 'source'
      })
    ))
  }

  // Collect all base data from the Y.Doc synchronously before any async operations
  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  const [assignmentTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')
  const [assignmentSlugline] = getValueByYPath<string>(ydoc.ele, 'meta.tt/slugline[0].value')
  const [ydocNewsValue] = getValueByYPath<string>(ydoc.ele, 'meta.core/newsvalue[0].value')
  const resolvedNewsValue = newsvalue ?? ydocNewsValue

  // Attempt translation if requested — this is async and may execute after
  // the provider disconnects, so we use the captured yjsDocument reference.
  if (wireContent && translationMode) {
    try {
      const translatedContent = await translateWireContent(wireContent, translationMode)
      if (yjsDocument) {
        yjsDocument.getMap('ele').set('content', translatedContent)
      }
    } catch (ex) {
      console.error('Translation failed, using original wire content', ex)
      toast.error(i18n.t('wires:creation.translationError'))
    }
  }

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
    wires,
    embargoUntil
  })

  if (!updatedPlanningId) {
    throw new Error('CreateAssignmentError')
  }

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
