import { Block, Document } from '@ttab/elephant-api/newsdoc'

export function twoOnTwoDocumentTemplate(payload?: { title?: string, text?: string, deliverableId?: string }): Document {
  console.log('🚀 ~ :4 ~ twoOnTwoDocumentTemplate ~ payload:', payload)
  return Document.create({
    uuid: payload?.deliverableId,
    uri: `core://article/${payload?.deliverableId}`,
    language: 'sv-se',
    title: payload?.title,
    type: 'core/article',
    content: [
      Block.create({
        type: 'core/text',
        data: { text: payload?.title || '' },
        role: 'heading-1'
      }),
      Block.create({
        type: 'core/text',
        data: {
          text: payload?.text || ''
        }
      })
    ],
    meta: [
      Block.create({
        type: 'core/newsvalue',
        value: '4'
      })
    ]
  })
}
