import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'
import type { PreprocessedTableData } from '@/components/Table/types'
import { getNewsvalue } from '@/lib/documentHelpers'
import { fromSubset, allFromSubset } from '@/lib/subsetHelpers'

export const PLANNING_SUBSET = [
  '.meta(type=\'core/newsvalue\')@{value}',
  '.meta(type=\'tt/slugline\')@{value}',
  '.links(type=\'core/section\')@{uuid}',
  '.links(type=\'core/section\')@{title}',
  '.meta(type=\'core/assignment\').links(type=\'core/author\' rel=\'assignee\')@{uuid}',
  '.meta(type=\'core/assignment\').meta(type=\'core/assignment-type\')@{value}',
  '.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid}',
  '@{title}',
  '@{uuid}'
] as const

const enum E {
  Newsvalue,
  Slugline,
  SectionUuid,
  SectionTitle,
  Assignees,
  Types,
  DeliverableUuids,
  Title,
  Uuid
}

export type PreprocessedPlanningData = PreprocessedTableData<DecoratorDataBase, {
  title?: string
  newsvalue?: string
  slugline?: string
  sectionUuid?: string
  sectionTitle?: string
  assignees: string[]
  types: string[]
  deliverableUuids: string[]
}>

export function preprocessPlanningData(data: DocumentStateWithDecorators<DecoratorDataBase>[]): PreprocessedPlanningData[] {
  return data.flatMap((item) => {
    const { subset } = item
    const uuid = fromSubset(subset, E.Uuid) ?? item.document?.uuid
    if (!uuid) return []

    const title = fromSubset(subset, E.Title) ?? item.document?.title
    const newsvalue = fromSubset(subset, E.Newsvalue) ?? getNewsvalue(item.document)
    const slugline = fromSubset(subset, E.Slugline) ?? item.document?.meta?.find((d) => d.type === 'tt/slugline')?.value

    const sectionLink = !subset?.length ? item.document?.links?.find((d) => d.type === 'core/section') : undefined
    const sectionUuid = fromSubset(subset, E.SectionUuid) ?? sectionLink?.uuid
    const sectionTitle = fromSubset(subset, E.SectionTitle) ?? sectionLink?.title

    const subsetAssignees = allFromSubset(subset, E.Assignees)
    const assignees = subsetAssignees.length > 0
      ? subsetAssignees
      : item.document?.meta?.reduce<string[]>((uuids, d) => {
        if (d.type === 'core/assignment' && Array.isArray(d.links)) {
          d.links.forEach((link) => {
            if (link.type === 'core/author' && link.rel === 'assignee') {
              uuids.push(link.uuid)
            }
          })
        }
        return uuids
      }, []) || []

    const subsetTypes = allFromSubset(subset, E.Types)
    const types = subsetTypes.length > 0
      ? subsetTypes
      : item.document?.meta?.reduce<string[]>((values, d) => {
        if (d.type === 'core/assignment' && Array.isArray(d.meta)) {
          d.meta.forEach((meta) => {
            if (meta.type === 'core/assignment-type') values.push(meta.value)
          })
        }
        return values
      }, []) || []

    const subsetDeliverables = allFromSubset(subset, E.DeliverableUuids)
    const deliverableUuids = subsetDeliverables.length > 0
      ? subsetDeliverables
      : item.document?.meta?.reduce<string[]>((uuids, meta) => {
        if (meta.type === 'core/assignment' && Array.isArray(meta.links)) {
          meta.links.forEach((link) => {
            if (link.rel === 'deliverable') uuids.push(link.uuid)
          })
        }
        return uuids
      }, []) || []

    return {
      ...item,
      id: uuid,
      _preprocessed: {
        title,
        newsvalue,
        slugline,
        sectionUuid,
        sectionTitle,
        assignees,
        types,
        deliverableUuids
      }
    }
  })
}
