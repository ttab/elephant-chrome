import { getSystemLanguage } from '../getSystemLanguage.js'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.js'

/**
* Create a template for a factbox document
* @returns Document
*/

export function factboxDocumentTemplate(id: string, payload?: TemplatePayload): Document {
  return Document.create({
    uuid: id,
    type: 'core/factbox',
    uri: `core://factbox/${id}`,
    title: payload?.title ?? '',
    language: payload?.language ?? getSystemLanguage(),
    content: payload?.content
      ? [...payload.content]
      : [
          Block.create({
            type: 'core/text',
            data: {
              text: ''
            }
          })
        ]
  })
}
