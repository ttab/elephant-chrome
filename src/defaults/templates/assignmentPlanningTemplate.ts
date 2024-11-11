import { Block } from '@ttab/elephant-api/newsdoc'

/**
 * Create a template structure for an assigment
 * @returns Block
 */
export function assignmentPlanningTemplate({ assignmentType, planningDate, slugLine }: {
  assignmentType: string
  planningDate: string
  slugLine?: string
}): Block {
  // TODO: Until we have a strategy for assignment dates
  // Set full day to true

  const startDate = new Date(`${planningDate}T00:00:00`)

  return Block.create({
    id: crypto.randomUUID(),
    type: 'core/assignment',
    data: {
      end_date: planningDate,
      full_day: 'true',
      start_date: planningDate,
      start: startDate.toISOString(),
      public: 'true',
      publish: '2024-02-09T10:30:00Z'

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
    ]
  })
}

