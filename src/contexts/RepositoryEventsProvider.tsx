import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useIndexedDB } from '../datastore/hooks/useIndexedDB'
import type { EventlogItem } from '@ttab/elephant-api/repository'

interface RPPBroadcastMessage {
  type: 'request' | 'sse'
  payload: string | EventlogItem
}

interface RepositoryEventsProviderState {
  eventSource?: EventSource
  subscribe: (eventTypes: string[], callback: (event: EventlogItem) => void) => () => void
}

class RetriableError extends Error { }
class AuthenticationError extends Error { }

export const RepositoryEventsContext = createContext<RepositoryEventsProviderState>({
  subscribe: () => { return () => {} }
})

export const RepositoryEventsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const subscribers = useRef<Record<string, Array<(data: EventlogItem) => void>>>({})
  const IDB = useIndexedDB()
  const [hasFocus, setHasFocus] = useState<boolean>(document.hasFocus())
  const isListening = useRef<boolean>(false)
  const controller = useRef<AbortController | null>(null)
  const lastEventId = useRef<string | null>(null)
  const broadcastChannel = useRef<BroadcastChannel | null>(null)
  const tokenRef = useRef(data?.accessToken)

  useEffect(() => {
    tokenRef.current = data?.accessToken
  }, [data?.accessToken])

  /**
   * Listen for and handle broadcasted messages
   */
  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel('RepositoryEventsChannel')
    broadcastChannel.current.onmessage = (event: MessageEvent<RPPBroadcastMessage>) => {
      const { type, payload } = event.data

      if (isListening.current && type === 'request') {
        // Someone else is taking over
        controller.current?.abort()
        isListening.current = false
      } else if (!isListening.current && type === 'sse') {
        // Received sse from another tab/window, notify subscribers
        lastEventId.current = (payload as EventlogItem).id.toString()

        if (subscribers.current[event.type]) {
          subscribers.current[event.type].forEach((callback) => {
            callback(payload as EventlogItem)
          })
        }
      }
    }

    return () => {
      broadcastChannel.current?.close()
    }
  }, [])

  /**
   * Callback to start listening for server sent events
   */
  const listenForEvents = useCallback(async (url: URL, accessToken: string) => {
    if (controller.current) {
      controller.current.abort()
    }

    if (!lastEventId.current) {
      const { lastEventId: retrievedId } = await IDB.get<{ lastEventId: string }>('__meta', 'repositoryEvents') || {}
      if (retrievedId) {
        lastEventId.current = retrievedId
      }
    }

    controller.current = new AbortController()

    try {
      await listen(
        url,
        controller.current,
        (event) => {
          const id = event.id.toString()
          lastEventId.current = id

          void IDB.put('__meta', {
            id: 'repositoryEvents',
            lastEventId: lastEventId.current,
            timestamp: event.timestamp
          })

          // Notify subscribers in this browser tab/window
          if (subscribers.current[event.type]) {
            subscribers.current[event.type].forEach((callback) => {
              callback(event)
            })
          }

          // Notify other tabs
          broadcastChannel.current?.postMessage({
            type: 'sse',
            payload: event
          })
        },
        {
          topic: 'firehose',
          accessToken: accessToken,
          lastEventId: lastEventId.current
        }
      )
    } catch (ex) {
      if (ex instanceof AuthenticationError) {
        throw ex
      }
    }
  }, [IDB])


  /**
   * Subscribe and unsubscribe callbacks for maintaning subscribers
   */
  const subscribe = useCallback((eventTypes: string[], callback: (event: EventlogItem) => void) => {
    for (const eventType of eventTypes) {
      if (!subscribers.current[eventType]) {
        subscribers.current[eventType] = []
      }

      subscribers.current[eventType].push(callback)
    }

    return () => {
      for (const eventType of eventTypes) {
        subscribers.current[eventType] = (subscribers.current[eventType] || []).filter((cb) => cb !== callback)

        if (subscribers.current[eventType].length === 0) {
          delete subscribers.current[eventType]
        }
      }
    }
  }, [])


  /**
   * Setup focus handling
   */
  useEffect(() => {
    const handleBlur = () => {
      setHasFocus(false)
    }

    const handleFocus = () => {
      setHasFocus(true)
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])


  /**
   * When window receives focus we take over listening
   */
  useEffect(() => {
    if (isListening.current || !hasFocus || !tokenRef.current || !repositoryEventsUrl) {
      return
    }

    broadcastChannel.current?.postMessage({
      type: 'request',
      payload: ''
    })

    isListening.current = true

    let isRetryScheduled = false

    const retryListenForEvents = () => {
      const accessToken = tokenRef.current || ''
      void listenForEvents(repositoryEventsUrl, accessToken).catch((ex) => {
        if (ex instanceof AuthenticationError && !isRetryScheduled) {
          console.info('Retrying listening for events in 20 seconds...')

          isRetryScheduled = true
          setTimeout(() => {
            isRetryScheduled = false
            retryListenForEvents()
          }, 20000)
        }
      })
    }

    retryListenForEvents()
  }, [hasFocus, listenForEvents, repositoryEventsUrl])


  return (
    <RepositoryEventsContext.Provider value={{ subscribe }}>
      {children}
    </RepositoryEventsContext.Provider>
  )
}


async function listen(
  baseUrl: URL,
  controller: AbortController,
  onEvent: (event: EventlogItem) => void,
  options: {
    topic: string
    accessToken?: string | null
    lastEventId?: string | null
  }
) {
  const url = new URL(baseUrl)
  url.searchParams.set('topic', options.topic)

  const headers = {
    ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    ...(options.lastEventId ? { 'Last-Event-ID': options.lastEventId } : {})
  }

  console.info(`Listening for events after id ${options.lastEventId}...`)

  try {
    await fetchEventSource(url.toString(), {
      headers,
      signal: controller.signal,
      onopen(response) {
        if (response.status === 401) {
          throw new AuthenticationError('Unauthorized')
        }

        return Promise.resolve()
      },
      onmessage(event) {
        const msg = parseEventlogItem(event?.data)
        onEvent(msg)
      },
      onclose() {
      // If connection is unexpectedly closed by server, retry
        throw new RetriableError()
      },
      onerror(err) {
        if (err instanceof AuthenticationError) {
          throw err
        }
        if (!(err instanceof RetriableError)) {
          controller.abort()
        }
      }
    })
  } catch (ex) {
    if (ex instanceof AuthenticationError) {
      throw ex
    }
  }
}

function parseEventlogItem(data: string): EventlogItem {
  try {
    const parsed = JSON.parse(data) as EventlogItem
    if (parsed && typeof parsed.id === 'string'
      && typeof parsed.timestamp === 'string'
      && typeof parsed.type === 'string') {
      return parsed
    }
  } catch (error) {
    console.error('JSON parsing error:', error)
    throw new Error('Invalid EventlogItem format')
  }
  throw new Error('Invalid EventlogItem format')
}

