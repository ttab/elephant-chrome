import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { snapshotDocument } from '@/lib/snapshotDocument'
// import { yTextToSlateElement } from '@slate-yjs/core'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
// import type { YXmlText } from 'node_modules/yjs/dist/src/internals'
// import type { TBElement } from '@ttab/textbit'
// import type { Block } from '@ttab/elephant-api/newsdoc'

export type CreateArticleDocumentStatus = 'usable' | 'done' | undefined

export async function createQuickArticle({
  ydoc,
  status,
  timeZone,
  documentStatus,
  startDate,
  planningId,
  section
}: {
  ydoc: YDocument<Y.Map<unknown>>
  status: string
  session: Session
  planningId?: string
  timeZone: string
  documentStatus: CreateArticleDocumentStatus
  startDate?: string
  section?: {
    type: string
    rel: string
    uuid: string
    title: string
  }
}): Promise<{ updatedPlanningId: string | undefined }> {
  if (!ydoc || status !== 'authenticated') {
    console.error(`Failed adding article ${ydoc.id} to a planning`)
    throw new Error('Failed to authenticate')
  }

  const snapshotPromise = snapshotDocument(ydoc.id, {
    status: documentStatus
  }, ydoc.provider?.document)
    .catch((ex) => {
      console.error('Failed creating article snapshot', ex)
      throw new Error('ArticleCreationError')
    })

  // Create and collect all base data for the assignment
  const [title] = getValueByYPath<string>(ydoc.ele, 'root.title')
  const [newsvalue] = getValueByYPath<string>(ydoc.ele, 'meta.core/newsvalue[0].value')
  const [slugline] = getValueByYPath<string>(ydoc.ele, 'meta.tt/slugline[0].value')
  // const [sectionValue] = getValueByYPath<Block>(ydoc.ele, 'links.core/section[0]')

  // const content = yTextToSlateElement((ydoc.ele.get('content') as YXmlText))?.children as TBElement[]

  // const bodyTextNode = content.find((c) => {
  //   const properties = c.properties as { role?: string }
  //   return !properties.role
  // })?.children[0]

  // const bodyText = bodyTextNode && 'text' in bodyTextNode ? bodyTextNode?.text : ''

  const dt = new Date()
  let localDate: string
  let isoDateTime: string

  if (startDate) {
    // Use provided start date
    const date = startDate.split('T')[0]
    localDate = date
    const currentTime = `${new Date().toISOString().split('T')[1].split('.')[0]}Z`
    isoDateTime = `${date}T${currentTime}`
  } else {
    // create new date
    isoDateTime = `${new Date().toISOString().split('.')[0]}Z`
    localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  }

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    type: 'text',
    deliverableId: ydoc.id,
    slugline,
    title: title || 'Ny snabbartikel',
    priority: Number(newsvalue),
    publicVisibility: true,
    localDate,
    isoDateTime,
    section: {
      uuid: section?.uuid as string,
      title: section?.title as string
    }
  })

  // Ensure the snapshot is complete before showing the toast
  await snapshotPromise

  return { updatedPlanningId }
}
