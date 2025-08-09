import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import type { Wire } from '@/hooks/index/useDocuments/schemas/wire'
import { toast } from 'sonner'
import { ToastAction } from '../ToastAction'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { createStateless, StatelessType } from '@/shared/stateless'

export async function createArticle({
  provider: articleProvider,
  status,
  wire,
  planningId,
  planningTitle,
  section,
  timeZone,
  session
}: {
  provider: HocuspocusProvider
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
  const articleEle = articleProvider.document.getMap('ele')
  const [documentId] = getValueByYPath<string>(articleEle, 'root.uuid')

  if (!articleProvider || status !== 'authenticated' || !documentId) {
    console.error(`Failed adding new wire article ${documentId} to a planning`)
    toast.error('Kunde inte skapa ny artikel!')
    return
  }

  // Create article in repo
  articleProvider.sendStateless(
    createStateless(StatelessType.IN_PROGRESS, {
      state: false,
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
  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  const [assignmentTitle] = getValueByYPath<string>(articleEle, 'root.title')
  const [assignmentSlugline] = getValueByYPath<string>(articleEle, 'meta.tt/slugline[0].value')
  const [newsValue] = getValueByYPath<string>(articleEle, 'meta.core/newsvalue[0].value')

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    planningTitle,
    type: 'text',
    deliverableId: documentId,
    title: assignmentTitle || '',
    slugline: assignmentSlugline,
    priority: newsValue ? parseInt(newsValue) : 3,
    publicVisibility: false,
    localDate,
    isoDateTime,
    section,
    wire
  })

  toast.success(`Artikel skapad`, {
    action: <ToastAction planningId={updatedPlanningId} wireId={documentId} target='last' />
  })
}
