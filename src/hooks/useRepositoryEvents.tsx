import { useEffect, useContext } from 'react'
import { type ElephantRepositoryEvent, RepositoryEventsProviderContext } from '../contexts/RepositoryEventsProvider'

export const useRepositoryEvents = (eventType: string, callback: (data: ElephantRepositoryEvent) => void): void => {
  const { subscribe, unsubscribe } = useContext(RepositoryEventsProviderContext)

  useEffect(() => {
    subscribe(eventType, callback)

    return () => {
      unsubscribe(eventType, callback)
    }
  }, [eventType, callback, subscribe, unsubscribe])
}
