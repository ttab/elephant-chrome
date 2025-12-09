import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.ts'

// Two-on-two document template, following the creation of flash-level text assignments
export function twoOnTwoDocumentTemplate(deliverableId: string, text: string, payload?: TemplatePayload): Document {
  return Document.create({
    uuid: deliverableId,
    uri: `core://article/${deliverableId}`,
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
          text: text || ''
        }
      })
    ],
    meta: [
      ...payload?.meta?.['core/newsvalue'] || [Block.create({
        type: 'core/newsvalue'
      })],
      ...payload?.meta?.['tt/slugline'] || [Block.create({
        type: 'tt/slugline'
      })]
    ],
    links: [
      ...payload?.links?.['core/section'] || []
    ]
  })
}
