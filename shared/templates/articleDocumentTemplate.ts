import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.js'

/**
 * Generates a document template for an article.
 *
 * @param {string} id - The unique identifier for the article.
 * @param {TemplatePayload} [payload] - Optional payload containing additional template data.
 * @returns {Document} - The generated document template.
 */
export function articleDocumentTemplate(id: string, payload?: TemplatePayload): Document {
  // no descriptions in articles, remove those
  delete payload?.meta?.['core/description']

  // Special handling for core/story: for plannings, the core/story.rel is 'story',
  // while for articles it's 'subject'
  if (payload?.links?.['core/story']?.[0]) {
    payload.links['core/story'][0].rel = 'subject'
  }

  return Document.create({
    uuid: id,
    type: 'core/article',
    uri: `core://article/${id}`,
    language: 'sv-se',
    title: payload?.title,
    content: [
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        },
        role: 'heading-1'
      }),
      Block.create({
        type: 'core/text',
        data: {
          text: ''
        },
        role: 'vignette'
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
