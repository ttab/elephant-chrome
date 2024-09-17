import { Block } from '@/protos/service'

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
  // Set full day to true and end time to 22:59:59

  return Block.create({
    id: crypto.randomUUID(),
    type: 'core/assignment',
    data: {
      end_date: planningDate,
      full_day: 'true',
      start_date: planningDate,
      end: `${planningDate}T22:59:59Z`,
      start: `${getStartDate(planningDate)}T23:00:00Z`,
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

function getStartDate(planningDate: string): string {
  const date = new Date(planningDate)
  date.setDate(date.getDate() - 1)

  return date.toISOString().split('T')[0]
}
