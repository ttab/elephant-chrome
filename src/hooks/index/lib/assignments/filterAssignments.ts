import type { AssignmentInterface } from './types'

const filterKeys = [{ key: '_section', label: 'section' }, { key: '_deliverableStatus', label: 'status' }]

export interface Facets {
  [key: string]: Map<string, number>
}

/**
 * Filters assignments based on the provided statuses.
 *
 * @param {AssignmentInterface[] | undefined} assignments - The list of assignments to filter.
 * @param {string[]} filters - What to filter by.
 * @returns {AssignmentInterface[] | undefined} - The filtered list of assignments or undefined
 * @todo Add more generic filtering options.
 */
export function filterAssignments(assignments: AssignmentInterface[] | undefined, filters: Record<string, string | string[]>):
  AssignmentInterface[] | undefined {
  if (!assignments) {
    return
  }

  return assignments.filter((assignment) =>
    (filters?.status?.length ? assignment?._deliverableStatus && filters?.status?.includes(assignment?._deliverableStatus) : true)
    && (filters?.section?.length ? assignment?._section && filters?.section?.includes(assignment?._section) : true)
  )
}

/**
 * Gets facets for the specified keys.
 *
 * @param {AssignmentInterface[] | undefined} assignments - The list of assignments to get facets from.
 * @returns {Facets} - The facets for the specified keys.
 */
export function getFacets(assignments: AssignmentInterface[] | undefined): Facets {
  if (!assignments) return {}

  return assignments.reduce((acc, assignment) => {
    filterKeys.forEach(({ key, label }) => {
      const value = assignment[key as keyof AssignmentInterface]
      if (value) {
        if (!acc[label]) {
          acc[label] = new Map<string, number>()
        }
        if (!acc[label].has(value as string)) {
          acc[label].set(value as string, 0)
        }
        acc[label].set(value as string, acc[label].get(value as string)! + 1)
      }
    })
    return acc
  }, {} as Facets)
}
