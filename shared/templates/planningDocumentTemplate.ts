import { Document, Block } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.js'
import { getUserTimeZone } from '../../src/lib/getUserTimeZone.js'
import { getUTCDateRange } from '../datetime.js'

/**
 * Create a template structure for a planning document
 *
 * @returns Document
 */
export function planningDocumentTemplate(documentId: string, payload?: TemplatePayload): Document {
  const existingPublicDescription = payload?.meta?.['core/description']?.find((desc) => desc.role === 'public')

  const makeDate = () => {
    if (payload?.meta?.['core/event']) {
      const event = payload?.meta?.['core/event'][0]
      const targetDate = event.data?.end || event.data?.start
      return targetDate.split('T')[0]
    }

    const timeZonedPlanningDate = getUTCDateRange(new Date(), getUserTimeZone() || 'Europe/Stockholm')
    return timeZonedPlanningDate?.to.split('T')[0]
  }

  return Document.create({
    uuid: documentId,
    type: 'core/planning-item',
    uri: `core://newscoverage/${documentId}`,
    ...(payload?.title && { title: payload.title }),
    language: 'sv-se',
    meta: [
      ...payload?.meta?.['core/planning-item'] || [Block.create({
        type: 'core/planning-item',
        data: {
          public: 'true',
          // FIXME: Send end and start date from event to planning
          end_date: makeDate(),
          tentative: 'false',
          // FIXME: Send end and start date from event to planning
          start_date: makeDate()
        }
      })],

      ...payload?.meta?.['core/newsvalue'] || [Block.create({
        type: 'core/newsvalue'
      })],

      ...payload?.meta?.['tt/slugline'] || [Block.create({
        type: 'tt/slugline'
      })],

      existingPublicDescription || Block.create({
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
