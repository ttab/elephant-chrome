import type { AssignmentInterface } from './fetch'

/**
 * Filters assignments based on the provided statuses.
 *
 * @param {AssignmentInterface[] | undefined} assignments - The list of assignments to filter.
 * @param {string[]} filters - What to filter by.
 * @returns {AssignmentInterface[] | undefined} - The filtered list of assignments or undefined
 * @todo Add more generic filtering options.
 */
function filterAssignments(assignments: AssignmentInterface[] | undefined, filters: Record<string, string[]>):
  AssignmentInterface[] | undefined {
  if (!assignments) {
    return
  }

  return assignments.filter((assignment) =>
    (filters?.status?.length ? assignment?._deliverableStatus && filters?.status?.includes(assignment?._deliverableStatus) : true)
    && (filters?.section?.length ? assignment?._section && filters?.section?.includes(assignment?._section) : true)
  )
}

export default filterAssignments
