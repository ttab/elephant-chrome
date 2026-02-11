import { Document, Block } from '@ttab/elephant-api/newsdoc'
import { fromZonedTime } from 'date-fns-tz'
import type { TemplatePayload } from './index.js'
import { newLocalDate } from '@/shared/datetime.js'
import { DEFAULT_TIMEZONE } from '../../src/defaults/defaultTimezone.js'

/**
 * Create a template structure for a event document
 *
 * @returns Document
 */
export function eventDocumentTemplate(id: string, payload?: TemplatePayload): Document {
  const makeDate = (): string => {
    const currentLocalTime = newLocalDate(DEFAULT_TIMEZONE)

    if (typeof payload?.query?.from === 'string') {
      const baseDate = newLocalDate(DEFAULT_TIMEZONE, { date: payload.query.from })
      baseDate.setHours(
        currentLocalTime.getHours(),
        currentLocalTime.getMinutes(),
        currentLocalTime.getSeconds(),
        currentLocalTime.getMilliseconds()
      )

      return fromZonedTime(baseDate, DEFAULT_TIMEZONE).toISOString()
    }

    return fromZonedTime(currentLocalTime, DEFAULT_TIMEZONE).toISOString()
  }

  const eventDate = makeDate()
  return Document.create({
    uuid: id,
    type: 'core/event',
    uri: `core://event/${id}`,
    language: process.env.SYSTEM_LANGUAGE || 'sv-se',
    meta: [
      Block.create({
        type: 'core/event',
        data: {
          end: eventDate,
          start: eventDate,
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
