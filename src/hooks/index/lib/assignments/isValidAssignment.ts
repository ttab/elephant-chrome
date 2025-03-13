import type { Block } from '@ttab/elephant-api/newsdoc'

/**
 * Check that the assignment is valid and matches the given type.
 *
 * @param assignmentMeta - The metadata of the assignment to check.
 * @param type - The type to filter assignments by (e.g. text, picture).
 * @returns - Returns true if the assignment is valid and matches the given type, otherwise false.
 */
export function isValidAssignment(assignmentMeta: Block, type: string | string[] | undefined): boolean {
  if (assignmentMeta.type !== 'core/assignment') {
    return false
  }

  // If type is given, filter out anything but type (e.g. text, picture...)
  if (type && !assignmentMeta.meta.some((m) => m.type === 'core/assignment-type'
    && (Array.isArray(type) ? type.includes(m.value) : m.value === type))) {
    return false
  }

  return true
}
