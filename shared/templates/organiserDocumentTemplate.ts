import { Block, Document } from '@ttab/elephant-api/newsdoc'

/**
* Create a template for a section document
* @returns Document
*/

export function organiserDocumentTemplate(id: string): Document {
  return Document.create({
    uuid: id,
    type: 'core/organiser',
    uri: `core://organiser/${id}`,
    language: 'sv-se',
    title: '',
    meta: [
      Block.create({
        id: '',
        type: 'core/contact-info',
        data: {
          city: '',
          country: '',
          email: '',
          phone: '',
          streetAddress: ''
        }
      }),
      Block.create({
        type: 'core/definition',
        data: {
          text: ''
        },
        role: ''
      })
    ],
    links: [
      Block.create({
        url: '',
        type: 'text/html',
        rel: 'see-also'
      })
    ]
  })
}
