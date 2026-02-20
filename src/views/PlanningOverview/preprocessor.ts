import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'

export type PreprocessedPlanningData = DocumentStateWithDecorators<DecoratorDataBase> & {
  _preprocessed: {
    newsvalue?: string
    slugline?: string
    sectionUuid?: string
    sectionTitle?: string
    assignees: string[]
    types: string[]
    deliverableUuids: string[]
  }
}

export function preprocessPlanningData(data: DocumentStateWithDecorators<DecoratorDataBase>[]): PreprocessedPlanningData[] {
  return data.map((item) => {
    // Precompute newsvalue
    const newsvalue = item.document?.meta?.find((d) => d.type === 'core/newsvalue')?.value

    // Precompute slugline
    const slugline = item.document?.meta?.find((d) => d.type === 'tt/slugline')?.value

    // Precompute section (do both uuid and title in one pass)
    const sectionLink = item.document?.links?.find((d) => d.type === 'core/section')
    const sectionUuid = sectionLink?.uuid
    const sectionTitle = sectionLink?.title

    // Precompute assignees
    const assignees = item.document?.meta?.reduce<string[]>((uuids, d) => {
      if (d.type === 'core/assignment' && Array.isArray(d.links)) {
        d.links.forEach((link) => {
          if (link.type === 'core/author' && link.rel === 'assignee') {
            uuids.push(link.uuid)
          }
        })
      }
      return uuids
    }, []) || []

    // Precompute assignment types
    const types = item.document?.meta?.reduce<string[]>((values, d) => {
      if (d.type === 'core/assignment' && Array.isArray(d.meta)) {
        d.meta.forEach((meta) => {
          if (meta.type === 'core/assignment-type') values.push(meta.value)
        })
      }
      return values
    }, []) || []

    // Precompute deliverable UUIDs
    const deliverableUuids = item.document?.meta?.reduce<string[]>((uuids, meta) => {
      if (meta.type === 'core/assignment' && Array.isArray(meta.links)) {
        meta.links.forEach((link) => {
          if (link.rel === 'deliverable') uuids.push(link.uuid)
        })
      }
      return uuids
    }, []) || []

    return {
      ...item,
      id: item.document?.uuid,
      _preprocessed: {
        newsvalue,
        slugline,
        sectionUuid,
        sectionTitle,
        assignees,
        types,
        deliverableUuids
      }
    } as PreprocessedPlanningData
  })
}
