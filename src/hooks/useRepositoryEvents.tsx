import { useEffect, useContext } from 'react'
import { RepositoryEventsProviderContext } from '../contexts/RepositoryEventsProvider'

export const useRepositoryEvents = (eventType: string, callback: (data: unknown) => void): void => {
  const { subscribe, unsubscribe } = useContext(RepositoryEventsProviderContext)

  useEffect(() => {
    subscribe(eventType, callback)

    return () => {
      unsubscribe(eventType, callback)
    }
  }, [eventType, callback, subscribe, unsubscribe])
}
