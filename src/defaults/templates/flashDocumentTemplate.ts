import { Block, Document } from '@ttab/elephant-api/newsdoc'

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
    section,
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
          text: title || ''
        },
        role: 'heading-1'
      }),
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        }
      })
    ],
    links: []
  })

  if (section) {
    doc.links.push(Block.create({
      type: 'core/section',
      rel: 'section',
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
      title: author.name
    }))
  }

  return doc
}
