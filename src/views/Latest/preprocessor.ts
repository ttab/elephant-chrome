import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { PreprocessedTableData } from '@/components/Table/types'
import { getAssignments, getDeliverableLink, getSectionLink } from '@/lib/documentHelpers'
import { fromSubset } from '@/lib/subsetHelpers'

export const LATEST_SUBSET = [
  '.meta(type=\'tt/slugline\')@{value}',
  '.links(type=\'core/section\')@{uuid}',
  '.links(type=\'core/section\')@{title}',
  '.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid}',
  '@{title}',
  '@{uuid}'
] as const

const enum E {
  Slugline,
  SectionUuid,
  SectionTitle,
  DeliverableUuids,
  Title,
  Uuid
}

export type LatestDecorator = MetricsDecorator

export type PreprocessedLatestData = PreprocessedTableData<LatestDecorator, {
  planningId: string
  deliverableUuid?: string
  deliverableType?: string
  deliverableVersion?: string
  title?: string
  slugline?: string
  sectionTitle?: string
  sectionUuid?: string
  publishTime?: string
  documentType?: string
}> & {
  _assignment?: Block
}

export function preprocessLatestData(data: DocumentStateWithDecorators<LatestDecorator>[]): PreprocessedLatestData[] {
  const flattened: PreprocessedLatestData[] = []

  for (const doc of data) {
    if (!doc.includedDocuments?.length) continue

    const { subset } = doc
    const planningId = fromSubset(subset, E.Uuid) ?? doc.document?.uuid ?? ''

    const slugline = fromSubset(subset, E.Slugline) ?? doc.document?.meta?.find((m) => m.type === 'tt/slugline')?.value

    const fallback = !subset?.length ? getSectionLink(doc.document) : undefined
    const sectionUuid = fromSubset(subset, E.SectionUuid) ?? fallback?.uuid
    const sectionTitle = fromSubset(subset, E.SectionTitle) ?? fallback?.title

    // Build O(1) lookup: deliverable UUID -> assignment block
    const assignmentByDeliverable = new Map<string, Block>()
    for (const assignment of getAssignments(doc.document)) {
      const uuid = getDeliverableLink(assignment)
      if (uuid) assignmentByDeliverable.set(uuid, assignment)
    }

    for (const included of doc.includedDocuments) {
      const hasUsable = included.state?.meta?.heads?.usable?.version
      if (!hasUsable) continue

      flattened.push({
        ...doc,
        _assignment: assignmentByDeliverable.get(included.uuid),
        id: included.uuid,
        _preprocessed: {
          planningId,
          deliverableUuid: included.uuid,
          deliverableVersion: hasUsable.toString(),
          title: included.state?.document?.title,
          deliverableType: included.state?.document?.type,
          slugline,
          sectionTitle,
          sectionUuid,
          publishTime: included.__updater?.time || included.state?.meta?.heads?.usable?.created,
          documentType: included.state?.document?.uri
        }
      })
    }
  }

  return flattened
}
