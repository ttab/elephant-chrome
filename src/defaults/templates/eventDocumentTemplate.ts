import { Document, Block } from '@ttab/elephant-api/newsdoc'

/**
 * Create a template structure for a event document
 *
 * @returns Document
 */
// FIXME: Get correct dateGranularity and datetime from Date Component
export function eventDocumentTemplate(id: string): Document {
  return Document.create({
    uuid: id,
    type: 'core/event',
    uri: `core://event/${id}`,
    language: 'sv-se',
    meta: [
      Block.create({
        type: 'core/event',
        data: {
          end: new Date().toISOString(),
          start: new Date().toISOString(),
          registration: '',
          dateGranularity: 'datetime'
        }
      }),
      Block.create({
        type: 'core/newsvalue',
        value: '3'
      }),
      Block.create({
        type: 'core/description',
        data: { text: '' },
        role: 'public'
      })
    ]
  })
}
