import type { AssignmentInterface } from './fetch'

/**
 * Filters assignments based on the provided statuses.
 *
 * @param {AssignmentInterface[] | undefined} assignments - The list of assignments to filter.
 * @param {string[]} statuses - The list of statuses to filter by.
 * @returns {AssignmentInterface[] | undefined} - The filtered list of assignments or undefined if no assignments are provided.
 * @todo Add more generic filtering options.
 */
function filterAssignments(assignments: AssignmentInterface[] | undefined, statuses: string[]): AssignmentInterface[] | undefined {
  if (!assignments) {
    return
  }

  return assignments.filter((assignment) => assignment?._deliverableStatus && statuses.includes(assignment?._deliverableStatus))
}

export default filterAssignments
