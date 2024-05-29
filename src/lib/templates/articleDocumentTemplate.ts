import { Block, Document } from '@/protos/service'

/**
* Create a template for a article document
* @returns Document
*/

export function articleDocumentTemplate(id: string): Document {
  return Document.create({
    uuid: id,
    type: 'core/article',
    uri: `core://article/${id}`,
    language: 'sv-se',
    title: 'title', // TODO: Add slug
    content: [
      Block.create({
        type: 'core/heading-1',
        data: {
          text: ''
        }
      }),
      // TODO: Insert tt/visual placeholder/dropzone
      Block.create({
        type: 'tt/dateline'
      }),
      Block.create({
        type: 'core/preamble'
      }),
      Block.create({
        type: 'core/paragraph'
      })
    ]
  })
}
