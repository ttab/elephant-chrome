import { Block, Document } from '@ttab/elephant-api/newsdoc'

/**
* Create a template for a factbox document
* @returns Document
*/

export function factboxDocumentTemplate(id: string): Document {
  return Document.create({
    uuid: id,
    type: 'core/factbox',
    uri: `core://factbox/${id}`,
    language: process.env.SYSTEM_LANGUAGE || 'sv-se',
    title: '',
    content: [
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        }
      })
    ]
  })
}
