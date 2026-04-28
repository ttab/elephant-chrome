import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.js'
import { getSystemLanguage } from '@/shared/getSystemLanguage.js'

export function timelessArticleDocumentTemplate(
  id: string,
  payload?: TemplatePayload
): Document {
  delete payload?.meta?.['core/description']

  if (payload?.links?.['core/story']?.[0]) {
    payload.links['core/story'][0].rel = 'subject'
  }

  return Document.create({
    uuid: id,
    type: 'core/article#timeless',
    uri: `core://article/${id}`,
    language: payload?.language ?? getSystemLanguage(),
    title: payload?.title,
    content: [
      Block.create({
        type: 'core/text',
        data: { text: '' },
        role: 'heading-1'
      }),
      Block.create({
        type: 'core/text',
        data: { text: '' },
        role: 'vignette'
      }),
      Block.create({
        type: 'core/text',
        data: { text: '' },
        role: 'preamble'
      }),
      Block.create({
        type: 'core/text',
        data: { text: '' }
      })
    ],
    meta: [
      ...Object.values(payload?.meta ?? {}).flat()
    ],
    links: [
      ...Object.values(payload?.links ?? {}).flat(),
      Block.create({
        uri: 'tt://content-source/tt',
        type: 'core/content-source',
        title: 'TT',
        rel: 'source'
      })
    ]
  })
}
