import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { isYMap } from '@/lib/isType'
import { getValueByYPath, toSlateYXmlText } from '@/lib/yUtils'
import { YBlock } from '@/shared/YBlock'
import { toYMap } from '../../../src-srv/utils/transformations/lib/toYMap'
import * as Y from 'yjs'
import type { IDBAuthor } from 'src/datastore/types'

export function addDocumentToPlanning({ document, documentType, planningDocument, assignmentId, timeZone, author }: {
  document: Y.Doc
  documentType: 'text' | 'flash'
  planningDocument: Y.Doc
  assignmentId: string
  timeZone: string
  author: IDBAuthor | undefined
}): string {
  const item = document.getMap('ele')
  const [id] = getValueByYPath<string>(item, 'root.uuid')
  const [title] = getValueByYPath<string>(item, 'root.title')
  const [sections] = getValueByYPath<Y.Array<unknown>>(item, 'links.core/section', true)

  const planning = planningDocument.getMap('ele')
  const [planningTitle, planningRoot] = getValueByYPath<string>(planning, 'root.title')


  if (!id || !title || (!planningTitle && !sections?.length)) {
    throw new Error('Id, title and section is missing on new flash')
  }

  if (!isYMap(planningRoot)) {
    throw new Error('Planning document is faulty, no root Y.Map exists')
  }

  // If no planning title exists this is a new planning
  if (!planningTitle) {
    (planningRoot).set('title', toSlateYXmlText(title))

    // Transfer section to planning
    const [planningLinks] = getValueByYPath<Y.Map<Y.Array<unknown>>>(planning, 'links', true)
    // @ts-expect-error Typescript don't understand safeguard !flashSections?.length
    planningLinks?.set('core/section', sections.clone())
  }

  // Create assignment (using given assignment id)
  const dt = new Date()
  const zuluISODate = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localISODateTime = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)

  // Create assignment block
  const eleAssignment = YBlock.create({
    id: assignmentId,
    type: 'core/assignment',
    title,
    data: {
      full_day: 'false',
      start_date: localISODateTime,
      end_date: localISODateTime,
      start: zuluISODate,
      end: zuluISODate,
      public: 'true',
      publish: zuluISODate
    },
    meta: [
      {
        type: 'core/assignment-type',
        value: documentType
      },
      {
        type: 'core/description',
        data: {
          text: ''
        }
      }
    ],
    links: [
      {
        type: `core/${documentType}`,
        rel: 'deliverable',
        uuid: id
      },
      ...(author
        ? [{
            type: 'core/author',
            rel: 'assignee',
            role: 'primary',
            uuid: author.id,
            title: author.name
          }]
        : [])
    ]
  })

  const yAssignment = toYMap(eleAssignment[0] as unknown as Record<string, unknown>)

  const [yAssignments] = getValueByYPath(planning, 'meta.core/assignment', true)
  if (yAssignments) {
    (yAssignments as Y.Array<Y.Map<unknown>>).push([yAssignment])
  } else {
    const yMeta = planning.get('meta') as Y.Map<unknown>
    const newYAssignments = new Y.Array()

    newYAssignments.push([yAssignment])
    yMeta.set('core/assignment', newYAssignments)
  }

  return getValueByYPath<string>(planning, 'root.uuid')?.[0] || ''
}
