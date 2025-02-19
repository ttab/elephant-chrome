import { Document, Block } from '@ttab/elephant-api/newsdoc'
import { currentDateInUTC } from '../../lib/datetime'
import type { TemplatePayload } from '.'

/**
 * Create a template structure for a planning document
 *
 * @returns Document
 */
export function planningDocumentTemplate(documentId: string, payload?: TemplatePayload): Document {
  return Document.create({
    uuid: documentId,
    type: 'core/planning-item',
    uri: `core://newscoverage/${documentId}`,
    ...(payload?.title && { title: payload.title }),
    language: 'sv-se',
    meta: [
      Block.create({
        type: 'core/planning-item',
        data: {
          public: 'true',
          // FIXME: Send end and start date from event to planning
          end_date: currentDateInUTC(),
          tentative: 'false',
          // FIXME: Send end and start date from event to planning
          start_date: currentDateInUTC()
        }
      }),

      ...payload?.meta?.['core/newsvalue'] || [Block.create({
        type: 'core/newsvalue'
      })],

      ...payload?.meta?.['tt/slugline'] || [Block.create({
        type: 'tt/slugline'
      })],

      Block.create({
        type: 'core/description',
        // FIXME: Send description from event to planning
        data: { text: '' },
        role: 'public'
      }),

      Block.create({
        type: 'core/description',
        data: { text: '' },
        role: 'internal'
      })
    ],
    links: [
      ...payload?.links?.['core/event'] || [],
      ...payload?.links?.['core/story'] || [],
      ...payload?.links?.['core/section'] || []
    ]
  })
}
