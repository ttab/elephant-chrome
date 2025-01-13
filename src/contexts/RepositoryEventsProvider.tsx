import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useIndexedDB } from '../datastore/hooks/useIndexedDB'
import type { EventlogItem } from '@ttab/elephant-api/repository'


interface RepositoryEventsProviderState {
  eventSource?: EventSource
  subscribe: (eventType: string[], callback: (data: EventlogItem) => void) => void
  unsubscribe: (eventType: string[], callback: (data: EventlogItem) => void) => void
}

interface ElephantBroadcastMessage {
  msg: string
  payload?: unknown
}

class RetriableError extends Error { }

export const RepositoryEventsProviderContext = createContext<RepositoryEventsProviderState>({
  subscribe: () => { },
  unsubscribe: () => { }
})

export const RepositoryEventsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const isLeaderRef = useRef<boolean>(true)
  const subscribers = useRef<Record<string, Array<(data: EventlogItem) => void>>>({})
  const IDB = useIndexedDB()
  const [listeningForSSE, setListeningForSSE] = useState<boolean>(false)

  // Handle broadcasted messages (browser tab leadership election)
  useEffect(() => {
    const ebcc = new BroadcastChannel('elephant-bcc')

    const closeHandler = (): void => {
      if (isLeaderRef.current) {
        ebcc.postMessage({ msg: 'leader:exit' })
      }
    }

    const messageHandler = (event: MessageEvent<ElephantBroadcastMessage>): void => {
      switch (event.data.msg) {
        case 'leader:exit':
          // The leader has left the building, request leadership,
          // use variable timeout to avoid race conditions.
          setTimeout(() => {
            isLeaderRef.current = true
            ebcc.postMessage({ msg: 'leader:request' })
          }, Math.round(Math.random() * 100))
          break

        case 'leader:request':
          // Another tab requested leadership
          if (isLeaderRef.current) {
            ebcc.postMessage({ msg: 'leader:exist' })
          }
          break

        case 'leader:exist':
          // Another tab was already the leader
          isLeaderRef.current = false
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
  }, [])


  // Listen and react to Server Sent Events in leading tab
  useEffect(() => {
    if (!isLeaderRef.current || !repositoryEventsUrl || !data?.accessToken) {
      return
    }

    // Create url
    const url = new URL(repositoryEventsUrl)
    url.searchParams.set('topic', 'firehose')

    // Listen for messages
    const fetchEvents = async (): Promise<void> => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${data.accessToken}`
      }

      // Get last event id so we can continue where we left
      const { lastEventId } = await IDB.get<{ lastEventId: string }>('__meta', 'repositoryEvents') || {}
      if (lastEventId) {
        headers['Last-Event-ID'] = lastEventId
      }

      setListeningForSSE(true)

      try {
        await fetchEventSource(url.toString(), {
          openWhenHidden: true, // As we already have a session leader (one tab listens) we don't want to stop when hidden
          headers,
          onmessage(event) {
            const msg: EventlogItem = event?.data ? JSON.parse(event?.data) : {}
            const callbacks = subscribers.current[msg.type] || []
            void IDB.put('__meta', {
              id: 'repositoryEvents',
              lastEventId: msg.id,
              timestamp: msg.timestamp
            })
            callbacks.forEach((callback) => callback(msg))
          },
          onclose() {
            // If connection is unexpectedly closed by server, retry
            throw new RetriableError()
          },
          onerror(err) {
            if (!(err instanceof RetriableError)) {
              setListeningForSSE(false)
            }
          }
        })
      } catch (_ex) {
        setListeningForSSE(false)
      }
    }
    void fetchEvents()
  }, [repositoryEventsUrl, data?.accessToken, subscribers, IDB, listeningForSSE])

  const subscribe = useCallback((eventTypes: string[], callback: (data: EventlogItem) => void) => {
    for (const eventType of eventTypes) {
      subscribers.current[eventType] = [...(subscribers.current[eventType] || []), callback]
    }
  }, [subscribers])

  const unsubscribe = useCallback((eventTypes: string[], callback: (data: EventlogItem) => void) => {
    for (const eventType of eventTypes) {
      subscribers.current[eventType] = (subscribers.current[eventType] || []).filter((cb) => cb !== callback)
    }
  }, [subscribers])

  return (
    <RepositoryEventsProviderContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </RepositoryEventsProviderContext.Provider>
  )
}
