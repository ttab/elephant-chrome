import { Block, Document } from '@ttab/elephant-api/newsdoc'
import { getSystemLanguage } from '@/shared/getSystemLanguage.js'
import type { TemplatePayload } from './index.ts'

export function hastDocumentTemplate(id: string, payload?: TemplatePayload): Document {
  return Document.create({
    uuid: id,
    uri: `core://article/${id}`,
    language: getSystemLanguage(),
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
        data: { text: '' }
      })
    ],
    meta: [
      Block.create({ type: 'core/newsvalue', value: '5' }),
      Block.create({ type: 'tt/slugline', value: 'hast' }),
      Block.create({ type: 'ntb/hast', value: '1' })
    ],
    links: [
      ...payload?.links?.['core/section'] || []
    ]
  })
}
