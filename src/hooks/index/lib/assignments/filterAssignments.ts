import type { PreprocessedApprovalData } from '@/views/Approvals/preprocessor'

export interface Facets {
  [key: string]: Map<string, number>
}

/**
 * Filters approval items based on the provided filters.
 */
export function filterAssignments(
  items: PreprocessedApprovalData[] | undefined,
  filters: Record<string, string | string[]>
): PreprocessedApprovalData[] | undefined {
  if (!items) {
    return
  }

  return items.filter((item) => {
    const status = item._deliverable?.status
    const section = item._preprocessed.sectionUuid

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
 */
export function getFacets(items: PreprocessedApprovalData[] | undefined): Facets {
  if (!items) return {}

  return items.reduce((acc, item) => {
    const status = item._deliverable?.status
    const section = item._preprocessed.sectionUuid

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
