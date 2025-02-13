import { useContext, useEffect } from 'react'
import { SharedSSEWorkerContext } from '@/contexts/SharedSSEWorkerProvider'
import type { EventlogItem } from '@ttab/elephant-api/repository'

export const useRepositoryEvents = (eventTypes: string | string[], callback: (event: EventlogItem) => void) => {
  const context = useContext(SharedSSEWorkerContext)

  if (!context) {
    throw new Error('useRepositoryEvents must be used within a SharedSSEWorkerProvider')
  }

  useEffect(() => {
    const eventTypesArray = (Array.isArray(eventTypes)) ? eventTypes : [eventTypes]
    const unsubscribe = context.subscribe(eventTypesArray, callback)
    return () => unsubscribe()
  }, [context, eventTypes, callback])
}
