import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { StatusDecorator } from '@/hooks/useRepositorySocket/decorators/statuses'
import type { MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import type { Block } from '@ttab/elephant-api/newsdoc'

export type LatestDecorator = StatusDecorator & MetricsDecorator

export type PreprocessedLatestData = DocumentStateWithDecorators<LatestDecorator> & {
  _assignment?: Block
  id?: string
  _preprocessed: {
    planningId: string
    deliverableUuid?: string
    deliverableType?: string
    title?: string
    slugline?: string
    sectionTitle?: string
    sectionUuid?: string
    publishTime?: string
    documentType?: string
  }
}

export function latestPreprocessor(data: DocumentStateWithDecorators<LatestDecorator>[]): PreprocessedLatestData[] {
  const flattened: PreprocessedLatestData[] = []

  for (const doc of data) {
    if (!doc.includedDocuments?.length) continue

    const planningId = doc.document?.uuid || ''
    const slugline = doc.document?.meta?.find((m) => m.type === 'tt/slugline')?.value
    const sectionLink = doc.document?.links?.find((l) => l.type === 'core/section')
    const sectionUuid = sectionLink?.uuid
    const sectionTitle = sectionLink?.title

    for (const included of doc.includedDocuments) {
      const hasUsable = included.state?.meta?.heads?.usable?.version
      if (!hasUsable) continue

      const assignment = doc.document?.meta?.find(
        (block: Block) => block.type === 'core/assignment'
          && block.links?.some((link) => link.rel === 'deliverable' && link.uuid === included.uuid)
      )

      const publishTime = (included as { __updater?: { time: string } })?.__updater?.time
        || included.state?.meta?.heads?.usable?.created

      flattened.push({
        ...doc,
        _assignment: assignment,
        id: included.uuid,
        _preprocessed: {
          planningId,
          deliverableUuid: included.uuid,
          title: included.state?.document?.title,
          deliverableType: included.state?.document?.type,
          slugline,
          sectionTitle,
          sectionUuid,
          publishTime,
          documentType: included.state?.document?.uri
        }
      })
    }
  }

  return flattened
}
