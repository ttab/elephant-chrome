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
    meta: [
      Block.create({
        type: 'core/section',
        data: {
          code: ''
        }
      })
    ]
  })
}
