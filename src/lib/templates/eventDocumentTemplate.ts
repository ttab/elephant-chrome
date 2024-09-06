import { Document, Block } from '@/protos/service'
import { currentDateInUTC } from '../datetime'

/**
 * Create a template structure for a event document
 *
 * @returns Document
 */
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
          end: currentDateInUTC(),
          start: currentDateInUTC(),
          registration: '',
          dateGranularity: 'date'
        }
      }),
      Block.create({
        type: 'core/newsvalue'
      }),
      Block.create({
        type: 'core/description',
        data: { text: '' },
        role: 'public'
      })
    ]
  })
}
