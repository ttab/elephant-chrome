import * as Y from 'yjs'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import type { Wire } from '@/shared/schemas/wire.js'
import { assignmentPlanningTemplate } from '@/shared/templates/assignmentPlanningTemplate.js'
import type { DeliverableType } from '@/shared/templates/lib/getDeliverableType.js'
import { group, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { toYMap } from '@/shared/transformations/toYMap.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import type { IDBAuthor } from '../src/datastore/types.js'

/**
* General function to create a new document as Y.Doc from a template
* @returns [string, Y.Doc]
*/
interface CreateDocumentParams<T> {
  template: (documentId: string, payload?: T) => Document
  inProgress?: boolean
  payload?: T
  createdDocumentIdRef?: React.MutableRefObject<string | undefined>
  documentId?: string
}

export function createDocument<T>({
  template,
  inProgress,
  payload,
  createdDocumentIdRef,
  documentId
}: CreateDocumentParams<T>): [string, Y.Doc] {
  // Use provided documentId or generate a new one
  const docId = documentId || crypto.randomUUID()

  // Set generated documentId to ref so that it can be
  // accessed from creating component
  if (createdDocumentIdRef) {
    createdDocumentIdRef.current = docId
  }

  const yDoc = new Y.Doc()

  toYjsNewsDoc(
    toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: template(docId, payload)
    }),
    yDoc
  )

  if (inProgress) {
    yDoc.getMap('__meta').set('isInProgress', true)
  }

  return [docId, yDoc]
}

/**
* Specific function to create a new assignment as Y.Map from a template
* and append it to the meta yMap
* @returns void
*/
export function appendAssignment({
  assignee,
  document,
  type,
  inProgress,
  slugLine,
  title,
  wire,
  assignmentData
}: {
  document: Y.Doc
  assignee?: IDBAuthor | null | undefined
  type: 'text' | 'flash' | 'graphic' | 'picture' | 'video' | 'picture/video'
  inProgress?: { sub: string }
  slugLine?: string
  title?: string
  wire?: Wire
  assignmentData?: Block['data']
}): [number, Y.Map<unknown>] {
  const meta = document.getMap('ele').get('meta') as Y.Map<unknown>

  // Get slugline from planning
  const slugLineArray = meta?.get('tt/slugline') as Y.Array<unknown>
  const slugLineYXml = slugLineArray?.get(0) as Y.Map<unknown>
  const slugLineFromPlanning = (slugLineYXml?.get('value') as Y.XmlText)?.toString() as string || undefined

  // Check if 'core/assignment' exists
  if (!meta.has('core/assignment')) {
    meta.set('core/assignment', new Y.Array())
  }

  // Get existing assignments
  const yAssignments = meta.get('core/assignment') as Y.Array<unknown>

  const yMeta = meta.get('core/planning-item') as Y.Array<Y.Map<unknown>>
  const planningDate = (yMeta?.get(0)?.get('data') as Y.Map<unknown>)
    ?.get('start_date') as string

  // Create new assignment from template
  const assignment = assignmentPlanningTemplate({
    assignee,
    assignmentType: type,
    planningDate,
    slugLine: type !== 'flash' ? slugLine || slugLineFromPlanning : undefined,
    title: title,
    wire,
    assignmentData
  })

  // Append __inProgress if needed
  if (inProgress) {
    // @ts-expect-error We need to override Block to add this property
    assignment.__inProgress = inProgress
  }

  // Group assignment
  const [groupedAssignment] = group([assignment], 'type')['core/assignment']

  // Convert to YMap
  const yAssignment = toYMap(
    groupedAssignment as unknown as Record<string, unknown>,
    new Y.Map()
  )

  // Push to existing assignments
  yAssignments.push([yAssignment])

  return [
    yAssignments.length - 1,
    yAssignment
  ]
}

/**
* Specific function to create a new article in Y.Doc as Y.Map from a template
*/
export function appendDocumentToAssignment({ document, id, index, slug, type }: {
  document: Y.Doc
  id: string
  index: number
  slug?: string
  type: DeliverableType
}): void {
  // Get meta yMap
  const meta = document.getMap('ele').get('meta') as Y.Map<unknown>

  // Get assignmentLinks
  const assignmentLinks = ((meta
    .get('core/assignment') as Y.Array<unknown>)
    .get(index) as Y.Map<unknown>)
    .get('links') as Y.Map<unknown>

  // Check if deliverableType exists
  if (!assignmentLinks.has(`core/${type}`)) {
    assignmentLinks.set(`core/${type}`, new Y.Array())
  }
  // Get existing articles
  const yDeliverables = assignmentLinks.get(`core/${type}`) as Y.Array<unknown>

  // Create new deliverable from template
  const deliverable = Block.create({
    type: `core/${type}`,
    uuid: id,
    rel: 'deliverable',
    title: slug
  })

  // Group deliverable
  const [groupedDeliverable] = group([deliverable], 'type')[`core/${type}`]

  // Convert to YMap
  const yDeliverable = toYMap(
    groupedDeliverable as unknown as Record<string, unknown>,
    new Y.Map()
  )
  // Push to existing articles
  yDeliverables.push([yDeliverable])
}
