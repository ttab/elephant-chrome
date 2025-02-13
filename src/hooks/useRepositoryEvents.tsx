import { useContext, useEffect } from 'react'
import { RepositoryEventsContext } from '@/contexts/RepositoryEventsProvider'
import type { EventlogItem } from '@ttab/elephant-api/repository'

export const useRepositoryEvents = (eventTypes: string | string[], callback: (event: EventlogItem) => void) => {
  const context = useContext(RepositoryEventsContext)

  if (!context) {
    throw new Error('useRepositoryEvents must be used within a RepositoryEventsContext')
  }

  useEffect(() => {
    const unsubscribe = context.subscribe(
      (Array.isArray(eventTypes)) ? eventTypes : [eventTypes],
      callback
    )

    return () => {
      unsubscribe()
    }
  }, [eventTypes, context, callback])
}
