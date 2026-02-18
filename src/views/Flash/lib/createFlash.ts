import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { yTextToSlateElement } from '@slate-yjs/core'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { YXmlText } from 'node_modules/yjs/dist/src/internals'
import type { TBElement } from '@ttab/textbit'
import type { QuickArticleData } from '@/shared/types'
import { Block } from '@ttab/elephant-api/newsdoc'

export type CreateFlashDocumentStatus = 'usable' | 'done' | 'approved' | undefined
export async function createFlash({
  ydoc,
  status,
  planningId,
  timeZone,
  documentStatus,
  section,
  startDate,
  planningSection,
  relatedDocsSlugline
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
    type: string
    rel: string
  }
  planningSection?: {
    type: string
    rel: string
    uuid: string
    title: string
  } | undefined
  startDate?: string
  relatedDocsSlugline: string
}): Promise<{
  documentStatus: CreateFlashDocumentStatus
  updatedPlanningId: string
  quickArticleData: QuickArticleData | undefined
} | undefined> {
  if (!ydoc || status !== 'authenticated') {
    console.error(`Failed adding flash ${ydoc.id} to a planning`)
    throw new Error('Failed to authenticate')
  }

  // Trigger the creation of the flash in the repository
  // dont await it here as we want to do other things in parallel
  const snapshotPromise = snapshotDocument(ydoc.id, {
    status: documentStatus
  }, ydoc.provider?.document)
    .catch((ex) => {
      console.error('Failed creating flash snapshot', ex)
      throw new Error('FlashCreationError')
    })

  // Create and collect all base data for the assignment
  const [flashTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')

  const content = yTextToSlateElement((ydoc.ele.get('content') as YXmlText))?.children as TBElement[]

  const bodyTextNode = content.find((c) => {
    const properties = c.properties as { role?: string }
    return !properties.role
  })?.children[0]

  const flashBodyText = bodyTextNode && 'text' in bodyTextNode ? bodyTextNode?.text : ''

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
    slugline: relatedDocsSlugline,
    priority: 5,
    publicVisibility: false,
    localDate,
    isoDateTime,
    section
  })

  // Ensure the snapshot is complete before showing the toast
  await snapshotPromise

  if (!updatedPlanningId) {
    throw new Error('CreateAssignmentError')
  }

  // A complementary text assignment is co-created for a quick first version.
  // Only create if the flash is immediately published, for now.
  const quickArticleData = documentStatus === 'usable'
    ? {
        deliverableId: crypto.randomUUID(),
        text: flashBodyText,
        payload: {
          title: flashTitle,
          meta: {
            'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '5' })],
            'tt/slugline': [
              Block.create({
                type: 'tt/slugline',
                value: !flashTitle
                  ? 'två-på-två'
                  : relatedDocsSlugline || `${flashTitle?.toLocaleLowerCase()?.split(' ').slice(0, 3).join('-').slice(0, 20)}`
              })]
          },
          links: {
            'core/section': [Block.create({
              type: 'core/section',
              uuid: section?.uuid || planningSection?.uuid,
              title: section?.title || planningSection?.title,
              rel: 'section'
            })]
          }
        }
      }
    : undefined

  return { quickArticleData, documentStatus, updatedPlanningId }
}
