import type { AssignmentInterface } from '@/hooks/index/useAssignments'

/**
 * Helper function that sorts assignments for the Approvals view, on these criteria:
 * - Publish times are given precedence over start times
 * - If assignment A's publish time is before assignment B's publish time,
 * assignment A is sorted first, and vice versa
 * - If any of the assignments lack a publish time, and the other does not,
 * the assignment holding the publish time is sorted first.
 * - If both the assignments lack a publish time, the function instead compares start times
 * - In the case start times are compared, the earliest time is sorted first.
 */
export const sortAssignments = (a: AssignmentInterface, b: AssignmentInterface) => {
  const aPublish = a.data.publish
  const bPublish = b.data.publish
  const aStart = a.data.start
  const bStart = b.data.start

  if (aPublish && !bPublish) {
    return -1
  }

  if (!aPublish && bPublish) {
    return 1
  }

  if (aPublish && bPublish && aPublish !== bPublish) {
    if (aPublish < bPublish) {
      return -1
    }
    return 1
  }

  if (aPublish && !bStart) {
    return -1
  }

  if (aStart && bStart) {
    if (aStart < bStart) {
      return -1
    }
    return 1
  }

  if (aStart && !bStart) {
    return -1
  }

  return 1
}
