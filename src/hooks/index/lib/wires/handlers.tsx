
// src/hooks/index/eventHandlers.ts
import type { EventlogItem } from '@ttab/elephant-api/repository'
import type { Repository } from '@/shared/Repository'
import type { Wire } from '.'
import type { Session } from 'next-auth'

const TIMEOUT = 5000

export const handleDocumentEvent = async ({
  event,
  session,
  repository,
  source,
  data,
  mutate,
  timeoutRef
}: {
  event: EventlogItem
  session: Session | null
  repository: Repository | undefined
  source: string[] | undefined
  data: Wire[] | undefined
  mutate: (data?: Wire[] | Promise<Wire[]>, shouldRevalidate?: boolean) => Promise<Wire[] | undefined>
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
}) => {
  if (session?.accessToken && repository && source && data) {
    try {
      const result = await repository.getDocument({ uuid: event.uuid, accessToken: session?.accessToken })
      const documentSource = result?.document?.links.find((link) => link.rel === 'source')?.uri

      if (documentSource && source.includes(documentSource)) {
        const updateData = [
          {
            id: result?.document?.uuid || '',
            source: {},
            score: 1,
            sort: [''],
            fields: {
              current_version: { values: [result?.version.toString()] },
              'document.rel.source.uri': { values: [documentSource] },
              modified: { values: [new Date().toISOString()] },
              'document.meta.core_newsvalue.value': {
                values: [result?.document?.meta?.find((meta) => meta.type === 'core/newsvalue')?.value || '']
              },
              'document.title': { values: [result?.document?.title || ''] },
              'document.meta.tt_wire.role': {
                values: [result?.document?.meta?.find((meta) => meta.type === 'tt/wire/role')?.value || '']
              },
              'document.rel.section.uuid': {
                values: [result?.document?.links?.find((link) => link.rel === 'section')?.uuid || '']
              },
              'document.rel.section.title': {
                values: [result?.document?.links?.find((link) => link.rel === 'section')?.title || '']
              }
            }
          },
          ...data
        ]

        // Optimistic update
        void mutate(updateData, false)


        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // wait for revalidation of new documents
        timeoutRef.current = setTimeout(() => {
          void mutate()
          timeoutRef.current = null
        }, TIMEOUT)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export const handleStatusEvent = ({
  event,
  data,
  mutate,
  timeoutRef
}: {
  event: EventlogItem
  data: Wire[] | undefined
  mutate: (data?: Wire[] | Promise<Wire[]>, shouldRevalidate?: boolean) => Promise<Wire[] | undefined>
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
}) => {
  let found = false
  const updatedData = data?.map((wire) => {
    if (wire.id === event.uuid) {
      found = true
      return {
        ...wire,
        fields: {
          ...wire.fields,
          [`heads.${event.status}.version`]: { values: [event.version.toString()] },
          [`heads.${event.status}.created`]: { values: [new Date().toISOString()] }
        }
      }
    }
    return wire
  })

  // If status event is found in current data, update it optimistically, start timeout to revalidate
  if (found) {
    void mutate(updatedData, false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      void mutate()
      timeoutRef.current = null
    }, TIMEOUT)
  }
}
