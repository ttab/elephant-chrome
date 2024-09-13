import { Block, Document } from '@/protos/service'

/**
* Create a template for a factbox document
* @returns Document
*/

export function factbox(id: string): Document {
  return Document.create({
    uuid: id,
    type: 'core/factbox',
    uri: `core://factbox/${id}`,
    language: 'sv-se',
    title: 'Rubrik',
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
