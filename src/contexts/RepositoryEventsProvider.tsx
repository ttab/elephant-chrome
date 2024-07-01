import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'

interface ElephantRepositoryEvent {
  event: string
  id: string
  language: string
  timestamp: string
  type: string
  updateUri: string
  uuid: string
  version: string
}

interface RepositoryEventsProviderState {
  eventSource?: EventSource
  subscribe: (eventType: string, callback: (data: ElephantRepositoryEvent) => void) => void
  unsubscribe: (eventType: string, callback: (data: ElephantRepositoryEvent) => void) => void
}

interface ElephantBroadcastMessage {
  msg: string
  payload?: unknown
}

export const RepositoryEventsProviderContext = createContext<RepositoryEventsProviderState>({
  subscribe: () => { },
  unsubscribe: () => { }
})

export const RepositoryEventsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const [isLeader, setIsLeader] = useState(true)
  const subscribers = useRef<Record<string, Array<(data: ElephantRepositoryEvent) => void>>>({})

  // Handle broadcasted messages (browser tab leadership election)
  useEffect(() => {
    const ebcc = new BroadcastChannel('elephant-bcc')

    const closeHandler = (): void => {
      if (isLeader) {
        ebcc.postMessage({ msg: 'leader:exit' })
      }
    }

    const messageHandler = (event: MessageEvent<ElephantBroadcastMessage>): void => {
      switch (event.data.msg) {
        case 'leader:exit':
          // The leader has left the building, request leadership,
          // use variable timeout to avoid race conditions.
          setTimeout(() => {
            setIsLeader(true)
            ebcc.postMessage({ msg: 'leader:request' })
          }, Math.round(Math.random() * 100))
          break

        case 'leader:request':
          // Another tab requested leadership
          if (isLeader) {
            ebcc.postMessage({ msg: 'leader:exist' })
          }
          break

        case 'leader:exist':
          // Another tab was already the leader
          setIsLeader(false)
          break
      }
    }

    // Start listening and request leadership
    ebcc.addEventListener('message', messageHandler)
    ebcc.postMessage({ msg: 'leader:request' })

    window.addEventListener('beforeunload', closeHandler)

    return () => {
      window.removeEventListener('beforeunload', closeHandler)
      ebcc.close()
    }
  }, [isLeader])


  // Listen and react to Server Sent Events in leading tab
  useEffect(() => {
    if (!isLeader || !repositoryEventsUrl || !data?.accessToken) {
      return
    }

    // Create url
    const url = new URL(repositoryEventsUrl)
    url.searchParams.set('topic', 'document')
    url.searchParams.set('token', data.accessToken)

    // Listen for messages
    const eventSource = new window.EventSource(url.toString())

    eventSource.onmessage = (event: MessageEvent<string | undefined>) => {
      const msg: ElephantRepositoryEvent = event?.data ? JSON.parse(event?.data) : {}
      const callbacks = subscribers.current[msg.type] || []

      callbacks.forEach(callback => callback(msg))
    }

    return () => {
      eventSource.close()
    }
  }, [repositoryEventsUrl, data?.accessToken, isLeader, subscribers])

  const subscribe = useCallback((eventType: string, callback: (data: ElephantRepositoryEvent) => void) => {
    subscribers.current[eventType] = [...(subscribers.current[eventType] || []), callback]
  }, [subscribers])

  const unsubscribe = useCallback((eventType: string, callback: (data: ElephantRepositoryEvent) => void) => {
    subscribers.current[eventType] = (subscribers.current[eventType] || []).filter(cb => cb !== callback)
  }, [subscribers])

  return (
    <RepositoryEventsProviderContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </RepositoryEventsProviderContext.Provider>
  )
}
