import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { PreprocessedTableData } from '@/components/Table/types'
import { getNewsvalue, getSectionLink } from '@/lib/documentHelpers'
import { fromSubset, allFromSubset } from '@/lib/subsetHelpers'

export const PLANNING_SUBSET = [
  '.meta(type=\'core/newsvalue\')@{value}',
  '.meta(type=\'tt/slugline\')@{value}',
  '.links(type=\'core/section\')@{uuid}',
  '.links(type=\'core/section\')@{title}',
  '.meta(type=\'core/assignment\').links(type=\'core/author\' rel=\'assignee\')@{uuid}',
  '.meta(type=\'core/assignment\').meta(type=\'core/assignment-type\')@{value}',
  '.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid}',
  '@{title}'
] as const

const enum E {
  Newsvalue,
  Slugline,
  SectionUuid,
  SectionTitle,
  Assignees,
  Types,
  DeliverableUuids,
  Title
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
    const { uuid, subset } = item
    if (!uuid) return []

    const title = fromSubset(subset, E.Title) ?? item.document?.title
    const newsvalue = fromSubset(subset, E.Newsvalue) ?? getNewsvalue(item.document)
    const slugline = fromSubset(subset, E.Slugline) ?? item.document?.meta?.find((d) => d.type === 'tt/slugline')?.value

    const fallback = !subset?.length ? getSectionLink(item.document) : undefined
    const sectionUuid = fromSubset(subset, E.SectionUuid) ?? fallback?.uuid
    const sectionTitle = fromSubset(subset, E.SectionTitle) ?? fallback?.title

    const subsetAssignees = allFromSubset(subset, E.Assignees)
    const subsetTypes = allFromSubset(subset, E.Types)
    const subsetDeliverables = allFromSubset(subset, E.DeliverableUuids)

    let assignees = subsetAssignees
    let types = subsetTypes
    let deliverableUuids = subsetDeliverables

    if (!assignees.length || !types.length || !deliverableUuids.length) {
      const extracted = extractFromAssignments(item.document?.meta)
      if (!assignees.length) assignees = extracted.assignees
      if (!types.length) types = extracted.types
      if (!deliverableUuids.length) deliverableUuids = extracted.deliverableUuids
    }

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

function extractFromAssignments(meta: Block[] | undefined) {
  const assignees: string[] = []
  const types: string[] = []
  const deliverableUuids: string[] = []

  for (const block of meta ?? []) {
    if (block.type !== 'core/assignment') continue

    for (const link of block.links ?? []) {
      if (link.type === 'core/author' && link.rel === 'assignee') {
        assignees.push(link.uuid)
      }
      if (link.rel === 'deliverable') {
        deliverableUuids.push(link.uuid)
      }
    }

    for (const m of block.meta ?? []) {
      if (m.type === 'core/assignment-type') {
        types.push(m.value)
      }
    }
  }

  return { assignees, types, deliverableUuids }
}
