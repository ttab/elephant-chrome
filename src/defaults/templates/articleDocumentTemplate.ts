import { Block, Document } from '@ttab/elephant-api/newsdoc'
import { ungroup } from '../../../src-srv/utils/transformations/groupedNewsDoc'
import type * as Y from 'yjs'

/**
* Create a template for a article document
* @returns Document
*/

export interface ArticlePayload {
  title: string
  meta: Block[]
  links: Block[]
}


export function createArticlePayload(document: Y.Doc, index: number): ArticlePayload | undefined {
  if (!document) return

  const ele = document.getMap('ele')
  const meta = ele.get('meta') as Y.Map<unknown>
  const links = ele.get('links') as Y.Map<unknown>

  const assignments = meta.get('core/assignment') as Y.Array<unknown>
  const currentAssignment = assignments.get(index) as Y.Map<unknown>
  const currentAssignmentMeta = currentAssignment.get('meta') as Y.Map<unknown>

  // Get data from assignment
  const slugline = (currentAssignmentMeta.get('tt/slugline') as Y.Array<unknown>)?.toJSON() || []
  const title = (currentAssignment.get('title') as Y.Map<unknown>)?.toJSON() as unknown as string || 'Untitled'

  // Get data from planning
  const story = (links.get('core/story') as Y.Array<unknown>)?.toJSON() || []
  const newsvalue = (meta.get('core/newsvalue') as Y.Array<unknown>)?.toJSON() || []

  const section = (links.get('core/section') as Y.Array<unknown>)?.toJSON() || []

  return {
    title,
    meta: ungroup({
      'tt/slugline': slugline,
      'core/newsvalue': newsvalue
    }),
    links: ungroup({
      'core/section': section,
      'core/story': story
    })
  }
}


export function articleDocumentTemplate(id: string, payload?: ArticlePayload): Document {
  return Document.create({
    uuid: id,
    type: 'core/article',
    uri: `core://article/${id}`,
    language: 'sv-se',
    title: payload?.title || 'Untitled',
    content: [
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        },
        role: 'heading-1'
      }),
      // TODO: Insert tt/visual placeholder/dropzone
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        },
        role: 'vignette'
      }),
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        },
        role: 'preamble'
      }),
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        }
      })
    ],
    meta: [...(payload?.meta || [])],
    links: [...(payload?.links || [])]
  })
}
