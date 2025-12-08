import { makeSlugline } from '@/views/Flash/lib/createTwoOnTwo'
import { Block, Document } from '@ttab/elephant-api/newsdoc'

// Two-on-two document template, following the creation of flash-level text assignments
export function twoOnTwoDocumentTemplate(payload?: {
  title?: string
  text?: string
  section?: {
    type: string
    uuid: string
    title: string
    rel: string
  }
  deliverableId?: string
}): Document {
  const slugline = makeSlugline(payload?.title)

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
        value: '5'
      }),
      Block.create({
        type: 'tt/slugline',
        value: slugline
      })
    ],
    links: [
      Block.create({
        type: 'core/section',
        uuid: payload?.section?.uuid,
        title: payload?.section?.title,
        rel: 'section'
      })
    ]
  })
}
