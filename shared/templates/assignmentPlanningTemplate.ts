import type { Wire } from '@/shared/schemas/wire.js'
import type { IDBAuthor } from '../../src/datastore/types.js'
import { Block } from '@ttab/elephant-api/newsdoc'
import { DEFAULT_TIMEZONE } from '../../src/defaults/defaultTimezone.js'
import { newLocalDate } from '@/shared/datetime.js'
import { UTCDate } from '@date-fns/utc'

/**
 * Create a template structure for an assigment
 * @returns Block
 */
export function assignmentPlanningTemplate({
  assignmentType,
  planningDate,
  slugLine,
  title,
  wire,
  assignmentData,
  assignee
}: {
  assignmentType: string
  planningDate: string
  slugLine?: string
  title?: string
  wire?: Wire
  assignmentData?: Block['data']
  assignee: IDBAuthor | null | undefined
}): Block {
  const systemNow = newLocalDate(DEFAULT_TIMEZONE)
  const systemHour = systemNow.getHours().toString()

  const startDateAndTime = (type: string): string => {
    const isTextFlashOrEditorialInfo = ['text', 'flash', 'editorial-info'].includes(type)

    if (isTextFlashOrEditorialInfo) {
      const utcTime = new UTCDate().toISOString().split('T')[1]
      return new Date(`${planningDate}T${utcTime}`).toISOString()
    } else {
      return new Date(`${planningDate}T00:00:00`).toISOString()
    }
  }

  const wireContentSourceDocument: Block[] = [
    wire
      ? Block.create({
        type: 'tt/wire',
        uuid: wire.id,
        title: wire.fields['document.title'].values[0],
        rel: 'source-document',
        data: {
          version: wire.fields['current_version'].values[0]
        }
      })
      : undefined
  ].filter((x): x is Block => x !== undefined)

  const author: Block[] = [
    assignee
      ? Block.create({
        uuid: assignee.id,
        type: 'core/author',
        title: assignee.name,
        rel: 'assignee',
        role: 'primary'
      })
      : undefined
  ].filter((x): x is Block => x !== undefined)

  // Text assignments should be set with a publish_slot
  if (assignmentType === 'text') {
    if (assignmentData && !assignmentData.publish_slot) {
      assignmentData.publish_slot = systemHour
    }
  }

  // Plain dates, are getting set with UI
  return Block.create({
    id: crypto.randomUUID(),
    type: 'core/assignment',
    title: title || undefined,
    // Use provided assignmentData or default values
    data: assignmentData || {
      full_day: 'false',
      end_date: planningDate,
      ...(assignmentType === 'text' && { publish_slot: systemHour }),
      start_date: planningDate,
      start: startDateAndTime(assignmentType),
      public: assignmentType === 'flash'
        ? 'false'
        : 'true'
    },
    meta: [
      {
        type: 'tt/slugline',
        value: slugLine || ''
      },
      {
        type: 'core/description',
        data: {
          text: ''
        },
        role: 'internal'
      },
      {
        type: 'core/assignment-type',
        value: assignmentType
      }
    ],
    links: [
      ...wireContentSourceDocument,
      ...author
    ]
  })
}
