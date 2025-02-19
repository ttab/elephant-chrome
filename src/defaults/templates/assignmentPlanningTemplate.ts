import type { Wire } from '@/hooks/index/lib/wires'
import { Block } from '@ttab/elephant-api/newsdoc'

/**
 * Create a template structure for an assigment
 * @returns Block
 */
export function assignmentPlanningTemplate({
  assignmentType,
  planningDate,
  slugLine,
  title,
  wire
}: {
  assignmentType: string
  planningDate: string
  slugLine?: string
  title?: string
  wire?: Wire
}): Block {
  /* TODO: When creating a flash, we need to set
      data: {
      full_day: 'false',
      start_date: localISODateTime, // today
      end_date: localISODateTime, // today
      start: zuluISODate, // now
      end: zuluISODate, // now
      public: 'true',
      publish: zuluISODate // is it needed, probably not?
    }, */

  const startDate = new Date(`${planningDate}T00:00:00`)

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

  // Plain dates, are getting set with UI
  return Block.create({
    id: crypto.randomUUID(),
    type: 'core/assignment',
    title: title || undefined,
    data: {
      full_day: 'false',
      end_date: planningDate,
      start_date: planningDate,
      start: startDate.toISOString(),
      public: 'true'
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
      ...wireContentSourceDocument
    ]
  })
}

