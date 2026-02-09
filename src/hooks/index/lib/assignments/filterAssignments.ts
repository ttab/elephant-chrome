import type { ApprovalItem } from '@/views/Approvals/types'
import { getSection } from '@/lib/documentHelpers'

export interface Facets {
  [key: string]: Map<string, number>
}

/**
 * Filters approval items based on the provided filters.
 *
 * @param {ApprovalItem[] | undefined} items - The list of approval items to filter.
 * @param {Record<string, string | string[]>} filters - What to filter by.
 * @returns {ApprovalItem[] | undefined} - The filtered list of approval items or undefined
 */
export function filterAssignments(
  items: ApprovalItem[] | undefined,
  filters: Record<string, string | string[]>
): ApprovalItem[] | undefined {
  if (!items) {
    return
  }

  return items.filter((item) => {
    const status = item.deliverable?.status
    const section = getSection(item.deliverable)

    const statusMatch = filters?.status?.length
      ? status && filters.status.includes(status)
      : true

    const sectionMatch = filters?.section?.length
      ? section && filters.section.includes(section)
      : true

    return statusMatch && sectionMatch
  })
}

/**
 * Gets facets for the specified keys.
 *
 * @param {ApprovalItem[] | undefined} items - The list of approval items to get facets from.
 * @returns {Facets} - The facets for the specified keys.
 */
export function getFacets(items: ApprovalItem[] | undefined): Facets {
  if (!items) return {}

  return items.reduce((acc, item) => {
    const status = item.deliverable?.status
    const section = getSection(item.deliverable)

    if (status) {
      if (!acc.status) {
        acc.status = new Map<string, number>()
      }
      if (!acc.status.has(status)) {
        acc.status.set(status, 0)
      }
      acc.status.set(status, acc.status.get(status)! + 1)
    }

    if (section) {
      if (!acc.section) {
        acc.section = new Map<string, number>()
      }
      if (!acc.section.has(section)) {
        acc.section.set(section, 0)
      }
      acc.section.set(section, acc.section.get(section)! + 1)
    }

    return acc
  }, {} as Facets)
}
