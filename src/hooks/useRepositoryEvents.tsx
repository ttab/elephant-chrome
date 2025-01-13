import { useEffect, useContext } from 'react'
import { type ElephantRepositoryEvent, RepositoryEventsProviderContext } from '../contexts/RepositoryEventsProvider'

export const useRepositoryEvents = (eventType: string | string[], callback: (data: ElephantRepositoryEvent) => void): void => {
  const { subscribe, unsubscribe } = useContext(RepositoryEventsProviderContext)
  const eventTypesArray = (Array.isArray(eventType)) ? eventType : [eventType]

  useEffect(() => {
    subscribe(eventTypesArray, callback)

    return () => {
      unsubscribe(eventTypesArray, callback)
    }
  }, [eventType, callback, subscribe, unsubscribe])
}
