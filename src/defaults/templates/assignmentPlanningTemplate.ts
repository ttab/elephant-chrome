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
  wire,
  assignmentData
}: {
  assignmentType: string
  planningDate: string
  slugLine?: string
  title?: string
  wire?: Wire
  assignmentData?: Block['data']
}): Block {
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
    // Use provided assignmentData or default values
    data: assignmentData || {
      full_day: 'false',
      end_date: planningDate,
      start_date: planningDate,
      start: startDate.toISOString(),
      public: 'false'
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

