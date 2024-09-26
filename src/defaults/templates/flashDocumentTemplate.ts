import { Block, Document } from '@/protos/service'

/**
* Create a template for a flash article document
* @returns Document
*/

export function flashDocumentTemplate(id: string, defaults: {
  title?: string
  section?: {
    uuid: string
    title: string
  }
  authors?: Array<{
    uuid: string
    name: string
  }>
} = {}): Document {
  const {
    title = '',
    section = undefined,
    authors = []
  } = defaults

  const doc = Document.create({
    uuid: id,
    type: 'core/flash',
    uri: `core://flash/${id}`,
    language: 'sv-se',
    title,
    content: [
      Block.create({
        type: 'core/text',
        data: {
          text: title
        },
        role: 'heading-1'
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
    ]
  })

  // Create links array if needed
  if (section || authors?.length) {
    doc.links = []
  }

  if (section) {
    doc.links.push(Block.create({
      type: 'core/section',
      uuid: section.uuid,
      title: section.title
    }))
  }


  for (const author of authors || []) {
    doc.links.push(Block.create({
      type: 'core/author',
      rel: 'author',
      role: 'primary',
      uuid: author.uuid,
      name: author.name
    }))
  }


  return doc
}
