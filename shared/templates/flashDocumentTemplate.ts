import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.js'
import getSystemLanguage from '@/shared/getLanguage.js'

/**
 * Generates a document template for a flash.
 *
 * @param {string} id - The unique identifier for the flash.
 * @param {TemplatePayload} [payload] - Optional payload containing additional template data.
 * @returns {Document} - The generated document template.
 */
export function flashDocumentTemplate(id: string, payload?: TemplatePayload): Document {
  // no story in flash, remove those
  delete payload?.links?.['core/story']

  return Document.create({
    uuid: id,
    type: 'core/flash',
    uri: `core://flash/${id}`,
    language: getSystemLanguage(),
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
        }
      })
    ],
    links: [
      ...Object.values(payload?.links ?? {}).flat()
    ]
  })
}
