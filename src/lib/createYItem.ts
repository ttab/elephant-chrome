import * as Y from 'yjs'
import { Block, type Document } from '@/protos/service'
import { newsDocToYDoc } from '../../src-srv/utils/transformations/yjs/yDoc'
import { assignmentPlanningTemplate } from './templates/assignmentPlanningTemplate'
import { toYMap } from '../../src-srv/utils/transformations/lib/toYMap'
import { type YBlock } from '@/shared/types'
import { get } from './yMapValueByPath'
import { group } from '../../src-srv/utils/transformations/lib/group'

/**
* General function to create a new document as Y.Doc from a template
* @returns [string, Y.Doc]
*/
export function createDocument(
  template: (
    id: string) => Document,
  inProgress?: boolean
): [string, Y.Doc] {
  const documentId = crypto.randomUUID()
  const yDoc = new Y.Doc()

  newsDocToYDoc(yDoc, {
    version: 0n,
    document: template(documentId)
  })

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
export function appendAssignment({ document, inProgress }: {
  document: Y.Doc
  inProgress?: boolean }): void {
  // Get meta yMap
  const meta = document.getMap('ele').get('meta') as Y.Map<unknown>

  // Check if 'core/assignment' exists
  if (!meta.has('core/assignment')) {
    meta.set('core/assignment', new Y.Array())
  }

  // Get existing assignments
  const yAssignments = meta.get('core/assignment') as Y.Array<unknown>

  // Create new assignment from template
  const assignment: YBlock = assignmentPlanningTemplate(
    'text',
    get(meta, 'core/planning-item[0].data.start_date') as unknown as string
  )

  // Append __inProgress if needed
  if (inProgress) {
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
