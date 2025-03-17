import type { Document } from '@ttab/elephant-api/newsdoc'
import type { AssignmentInterface } from './types'
import { isValidAssignment } from './isValidAssignment'

/**
 * Extract assignments of the given type from the planning document
 *
 * @param document - The planning document to extract assignments from.
 * @param type - The type of assignments to extract.
 * @returns An array of assignments matching the given type.
 */
export function getAssignmentsFromDocument(document: Document, type?: string | string[]): AssignmentInterface[] {
  const { meta, links } = document
  const assignments: AssignmentInterface[] = []

  // Loop over all meta elements to find assignments
  meta?.forEach((assignmentMeta) => {
    if (!isValidAssignment(assignmentMeta, type)) {
      return
    }

    // Collect all deliverable uuids
    const deliverable = assignmentMeta.links.find((l) => l.rel === 'deliverable')
    const _deliverableId = deliverable?.uuid
    const _deliverableType = deliverable?.type

    assignments.push({
      _id: document.uuid,
      _title: document.title,
      _newsvalue: meta?.find((assignmentMeta) => assignmentMeta.type === 'core/newsvalue')?.value,
      _section: links.find((l) => l.type === 'core/section')?.uuid,
      _deliverableId: _deliverableId || '',
      _deliverableType: _deliverableType || '',
      ...assignmentMeta
    })
  })

  return assignments
}
