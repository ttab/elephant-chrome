import { Block } from '@/protos/service'

/**
 * Create a template structure for an assigment
 * @returns Block
 */
export function assignmentPlanningTemplate(assignmentType: string, planningDate: string): Block {
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
    links: [
      {
        uuid: 'c37fdf3e-72ff-4e22-8b9f-1af0d60b0cd9',
        type: 'core/author',
        rel: 'assignee',
        role: 'primary',
        name: 'Nomen Nescio/TT'
      }
    ],
    meta: [
      {
        type: 'tt/slugline'
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
