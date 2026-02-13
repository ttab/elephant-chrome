import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'

export type PreprocessedEventData = DocumentStateWithDecorators<DecoratorDataBase> & {
  _preprocessed: {
    newsvalue?: string
    sectionUuid?: string
    sectionTitle?: string
    organiserTitle?: string
    eventStart?: string
    eventEnd?: string
    cancelled?: boolean
  }
}

export function preprocessEventData(data: DocumentStateWithDecorators<DecoratorDataBase>[]): PreprocessedEventData[] {
  return data.map((item) => {
    // Precompute newsvalue
    const newsvalue = item.document?.meta?.find((d) => d.type === 'core/newsvalue')?.value

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
      _preprocessed: {
        newsvalue,
        sectionUuid,
        sectionTitle,
        organiserTitle,
        eventStart,
        eventEnd,
        cancelled
      }
    } as PreprocessedEventData
  })
}
