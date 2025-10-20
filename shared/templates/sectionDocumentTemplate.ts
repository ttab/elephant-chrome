import { Block, Document } from '@ttab/elephant-api/newsdoc'

/**
* Create a template for a factbox document
* @returns Document
*/

export function sectionDocumentTemplate(id: string): Document {
  return Document.create({
    uuid: id,
    type: 'core/section',
    uri: `core://section/${id}`,
    language: 'sv-se',
    title: '',
    content: [
      Block.create({
        type: 'core/text',
        data: {
          code: ''
        }
      })
    ]
  })
}
