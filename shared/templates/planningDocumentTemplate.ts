import { Document, Block } from '@ttab/elephant-api/newsdoc'
import type { TemplatePayload } from './index.js'
import { getUserTimeZone } from '../../src/lib/getUserTimeZone.js'
import { getUTCDateRange, parseDate } from '@/shared/datetime.js'
import { DEFAULT_TIMEZONE } from '../../src/defaults/defaultTimezone.js'

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

    let currentDate = new Date()

    if (typeof payload?.query?.from === 'string') {
      const date = parseDate(payload.query.from)
      if (date) {
        currentDate = date
      }
    }

    const timeZonedPlanningDate = getUTCDateRange(currentDate, getUserTimeZone() || DEFAULT_TIMEZONE)
    return timeZonedPlanningDate?.to.split('T')[0]
  }

  return Document.create({
    uuid: documentId,
    type: 'core/planning-item',
    uri: `core://newscoverage/${documentId}`,
    ...(payload?.title && { title: payload.title }),
    language: process.env.SYSTEM_LANGUAGE,
    meta: [
      ...payload?.meta?.['core/planning-item'] || [Block.create({
        type: 'core/planning-item',
        data: {
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
