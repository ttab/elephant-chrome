import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'
import type { PreprocessedTableData } from '@/components/Table/types'
import { getNewsvalue } from '@/lib/documentHelpers'

export type PreprocessedEventData = PreprocessedTableData<DecoratorDataBase, {
  newsvalue?: string
  sectionUuid?: string
  sectionTitle?: string
  organiserTitle?: string
  eventStart?: string
  eventEnd?: string
  cancelled?: boolean
}>

export function preprocessEventData(data: DocumentStateWithDecorators<DecoratorDataBase>[]): PreprocessedEventData[] {
  return data.flatMap((item) => {
    const uuid = item.document?.uuid
    if (!uuid) return []

    const newsvalue = getNewsvalue(item.document)

    // Precompute section
    const sectionLink = item.document?.links?.find((d) => d.type === 'core/section')
    const sectionUuid = sectionLink?.uuid
    const sectionTitle = sectionLink?.title

    // Precompute organiser
    const organiserTitle = item.document?.links?.find((d) => d.rel === 'organiser')?.title

    // Precompute event meta (start, end, cancelled)
    const eventMeta = item.document?.meta?.find((d) => d.type === 'core/event')
    const eventStart = eventMeta?.data?.start
    const eventEnd = eventMeta?.data?.end
    const cancelled = eventMeta?.data?.cancelled === 'true'

    return {
      ...item,
      id: uuid,
      _preprocessed: {
        newsvalue,
        sectionUuid,
        sectionTitle,
        organiserTitle,
        eventStart,
        eventEnd,
        cancelled
      }
    }
  })
}
