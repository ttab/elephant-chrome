import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'
import type { PreprocessedTableData } from '@/components/Table/types'
import { getNewsvalue } from '@/lib/documentHelpers'
import { fromSubset } from '@/lib/subsetHelpers'

export const EVENTS_SUBSET = [
  '.meta(type=\'core/newsvalue\')@{value}',
  '.links(type=\'core/section\')@{uuid}',
  '.links(type=\'core/section\')@{title}',
  '.links(rel=\'organiser\')@{title}',
  '.meta(type=\'core/event\')@{data.start}',
  '.meta(type=\'core/event\')@{data.end}',
  '.meta(type=\'core/event\')@{data.cancelled}',
  '@{title}',
  '@{uuid}'
] as const

const enum E {
  Newsvalue,
  SectionUuid,
  SectionTitle,
  OrganiserTitle,
  EventStart,
  EventEnd,
  Cancelled,
  Title,
  Uuid
}

export type PreprocessedEventData = PreprocessedTableData<DecoratorDataBase, {
  title?: string
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
    const { subset } = item
    const uuid = fromSubset(subset, E.Uuid) ?? item.document?.uuid
    if (!uuid) return []

    const title = fromSubset(subset, E.Title) ?? item.document?.title
    const newsvalue = fromSubset(subset, E.Newsvalue) ?? getNewsvalue(item.document)

    const sectionLink = !subset?.length ? item.document?.links?.find((d) => d.type === 'core/section') : undefined
    const sectionUuid = fromSubset(subset, E.SectionUuid) ?? sectionLink?.uuid
    const sectionTitle = fromSubset(subset, E.SectionTitle) ?? sectionLink?.title

    const organiserTitle = fromSubset(subset, E.OrganiserTitle) ?? item.document?.links?.find((d) => d.rel === 'organiser')?.title

    const eventMeta = !subset?.length ? item.document?.meta?.find((d) => d.type === 'core/event') : undefined
    const eventStart = fromSubset(subset, E.EventStart) ?? eventMeta?.data?.start
    const eventEnd = fromSubset(subset, E.EventEnd) ?? eventMeta?.data?.end

    const cancelledStr = fromSubset(subset, E.Cancelled)
    const cancelled = cancelledStr !== undefined
      ? cancelledStr === 'true'
      : eventMeta?.data?.cancelled === 'true'

    return {
      ...item,
      id: uuid,
      _preprocessed: {
        title,
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
