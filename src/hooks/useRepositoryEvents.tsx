import { useEffect, useContext } from 'react'
import { RepositoryEventsProviderContext } from '../contexts/RepositoryEventsProvider'
import type { EventlogItem } from '@ttab/elephant-api/repository'

export const useRepositoryEvents = (eventType: string | string[], callback: (data: EventlogItem) => void): void => {
  const { subscribe, unsubscribe } = useContext(RepositoryEventsProviderContext)
  const eventTypesArray = (Array.isArray(eventType)) ? eventType : [eventType]

  useEffect(() => {
    subscribe(eventTypesArray, callback)

    return () => {
      unsubscribe(eventTypesArray, callback)
    }
  }, [eventType, callback, subscribe, unsubscribe])
}
