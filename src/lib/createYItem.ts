import * as Y from 'yjs'
import { assignmentPlanningTemplate } from '../defaults/templates/assignmentPlanningTemplate'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { toYMap } from '../../src-srv/utils/transformations/lib/toYMap'
import { toGroupedNewsDoc, group } from '../../src-srv/utils/transformations/groupedNewsDoc'
import { toYjsNewsDoc } from '../../src-srv/utils/transformations/yjsNewsDoc'

export interface TemplatePayload {
  eventId?: string
  eventTitle?: string
  newsvalue?: string
  createdDocumentIdRef?: React.MutableRefObject<string | undefined>
}
/**
* General function to create a new document as Y.Doc from a template
* @returns [string, Y.Doc]
*/
export function createDocument<T>(
  template: (
    documentId: string,
    payload?: T
  ) => Document,
  inProgress?: boolean,
  payload?: T,
  createdDocumentIdRef?: React.MutableRefObject<string | undefined>
): [string, Y.Doc] {
  const documentId = crypto.randomUUID()

  // Set generated documentId to ref so that it can be
  // accessed from creating component
  if (createdDocumentIdRef) {
    createdDocumentIdRef.current = documentId
  }

  const yDoc = new Y.Doc()

  toYjsNewsDoc(
    toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: template(documentId, payload)
    }),
    yDoc
  )

  if (inProgress) {
    const yRoot = yDoc.getMap('ele').get('root') as Y.Map<unknown>
    yRoot.set('__inProgress', true)
  }

  return [documentId, yDoc]
}

/**
* Specific function to create a new assignment as Y.Map from a template
* and append it to the meta yMap
* @returns void
*/
export function appendAssignment({ document, inProgress, slugLine }: {
  document: Y.Doc
  inProgress?: boolean
  slugLine?: string
}): void {
  // Get meta yMap
  const meta = document.getMap('ele').get('meta') as Y.Map<unknown>

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
    assignmentType: 'text',
    planningDate,
    slugLine
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
}

/**
* Specific function to create a new article in Y.Doc as Y.Map from a template
*/
export function appendArticle({ document, id, index, slug }: {
  document: Y.Doc
  id: string
  index: number
  slug: string
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
    type: 'core/article',
    uuid: id,
    rel: 'deliverable',
    title: slug
  })

  // Group article
  const [groupedArticle] = group([article], 'type')['core/article']

  // Convert to YMap
  const yArticle = toYMap(
    groupedArticle as unknown as Record<string, unknown>,
    new Y.Map()
  )
  // Push to existing articles
  yArticles.push([yArticle])
}
