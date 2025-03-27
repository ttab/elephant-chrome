import * as Y from 'yjs'
import { assignmentPlanningTemplate } from '../defaults/templates/assignmentPlanningTemplate'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { toYMap } from '../../src-srv/utils/transformations/lib/toYMap'
import { toGroupedNewsDoc, group } from '../../src-srv/utils/transformations/groupedNewsDoc'
import { toYjsNewsDoc } from '../../src-srv/utils/transformations/yjsNewsDoc'
import type { Wire } from '@/hooks/index/lib/wires'
import type { IDBAuthor } from 'src/datastore/types'

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
    const yRoot = yDoc.getMap('ele').get('root') as Y.Map<unknown>
    yRoot.set('__inProgress', true)
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
  inProgress?: boolean
  slugLine?: string
  title?: string
  wire?: Wire
  assignmentData?: Block['data']
}): number {
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
    slugLine: slugLine || slugLineFromPlanning,
    title: title,
    wire,
    assignmentData
  })

  // Append __inProgress if needed
  if (inProgress) {
    // @ts-expect-error We need to override Block to add this property
    assignment.__inProgress = true
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

  return yAssignments.length - 1
}

/**
* Specific function to create a new article in Y.Doc as Y.Map from a template
*/
export function appendDocumentToAssignment({ document, id, index, slug, type }: {
  document: Y.Doc
  id: string
  index: number
  slug?: string
  type: 'flash' | 'article'
}): void {
  // Get meta yMap
  const meta = document.getMap('ele').get('meta') as Y.Map<unknown>

  // Get assignmentLinks
  const assignmentLinks = ((meta
    .get('core/assignment') as Y.Array<unknown>)
    .get(index) as Y.Map<unknown>)
    .get('links') as Y.Map<unknown>

  // Check if 'core/article' exists
  if (!assignmentLinks.has('core/article')) {
    assignmentLinks.set('core/article', new Y.Array())
  }
  // Get existing articles
  const yArticles = assignmentLinks.get('core/article') as Y.Array<unknown>

  // Create new article from template
  const article = Block.create({
    type: `core/${type}`,
    uuid: id,
    rel: 'deliverable',
    title: slug
  })

  // Group article
  const [groupedArticle] = group([article], 'type')[`core/${type}`]

  // Convert to YMap
  const yArticle = toYMap(
    groupedArticle as unknown as Record<string, unknown>,
    new Y.Map()
  )
  // Push to existing articles
  yArticles.push([yArticle])
}
