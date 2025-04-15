import { Document } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from '.'

/**
 * Generates a document template for type editorial-info
 *
 * @param {string} id - The unique identifier for the article.
 * @param {TemplatePayload} [payload] - Optional payload containing additional template data.
 * @returns {Document} - The generated document template.
 */
export function editorialInfoDocumentTemplate(id: string, payload?: TemplatePayload): Document {
  return Document.create({
    uuid: id,
    type: 'core/editorial-info',
    uri: `core://editorial-info/${id}`, // Migrated documents have core://article/...
    language: 'sv-se',
    title: payload?.title,
    content: [
      {
        type: 'core/text',
        data: {
          text: ''
        },
        role: 'heading-1'
      },
      {
        type: 'core/text',
        data: {
          text: ''
        }
      }
    ],
    meta: [
      {
        type: 'core/note',
        data: {
          text: 'Obs! Detta meddelande är inte avsett för publicering.'
        },
        role: 'public'
      },
      ...payload?.meta?.['tt/slugline'] || []
    ],
    links: [
      ...payload?.links?.['core/section'] || []
    ]
  })
}
