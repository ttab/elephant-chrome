import { Block, Document } from '@ttab/elephant-api/newsdoc'

/**
* Create a template for a story document
* @returns Document
*/

export function storyDocumentTemplate(id: string): Document {
  const newDocument = Document.create({
    uuid: id,
    type: 'core/story',
    uri: `core://story/${id}`,
    language: 'sv-se',
    title: '',
    meta: [
      Block.create({
        type: 'core/definition',
        role: 'short',
        data: {
          text: ''
        }
      }),
      Block.create({
        type: 'core/definition',
        role: 'long',
        data: {
          text: ''
        }
      })
    ]
  })
  return newDocument
}
