import useSWR from 'swr'
import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import { useRepositoryEvents } from '../useRepositoryEvents'
import { useFilter } from '../useFilter'
import type { AssignmentInterface } from './lib/assignments/types'
import { fetchAssignments } from './lib/assignments/fetchAssignments'
import { structureAssignments } from './lib/assignments/structureAssignments'
import { filterAssignments } from './lib/assignments/filterAssignments'

export { AssignmentInterface }

const defaultStatuses = ['draft', 'done', 'approved', 'withheld']

/**
 * Fetch all assignments in specific date as Block[] extended with some planning level data.
 * Allows optional filtering by type and optional sorting into buckets.
 */
export const useAssignments = ({ date, type, slots }: {
  date: Date | string
  type?: string
  slots?: {
    key: string
    label: string
    hours: number[]
  }[]
}) => {
  const { data: session } = useSession()
  const { index, repository, timeZone } = useRegistry()
  const key = type ? `core/assignment/${type}/${date.toString()}` : 'core/assignment'

  const [filters] = useFilter(['status', 'section'])

  const { data, mutate, error } = useSWR<AssignmentInterface[] | undefined, Error>(key, (): Promise<AssignmentInterface[] | undefined> =>
    fetchAssignments({ index, repository, session, date }))

  if (error) {
    throw new Error('Assignment fetch failed:', { cause: error })
  }

  const filtersWithDefaults = {
    ...filters,
    status: filters?.status?.length ? filters.status : defaultStatuses
  }

  const filteredData = filterAssignments(data, filtersWithDefaults)
  const structuredData = structureAssignments(timeZone, filteredData || [], slots)


  useRepositoryEvents(['core/planning-item', 'core/planning-item+meta'], (event) => {
    if ((event.event !== 'document' && event.event !== 'status' && event.event !== 'delete_document')) {
      return
    }

    if (!Array.isArray(data)) {
      return void mutate()
    }

    for (const slot of structuredData) {
      const assignment = slot.items
        .find((assignment) =>
          (assignment._id === event.uuid || event.mainDocument === assignment._id))
      if (assignment) {
        void mutate()
        return
      }
    }
  })

  return structuredData
}
