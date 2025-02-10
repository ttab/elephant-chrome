import React, {
  createContext,
  useEffect,
  useRef,
  useCallback,
  useState
} from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '../hooks'
import type { EventlogItem } from '@ttab/elephant-api/repository'
import { SharedSSEWorker } from '@/defaults/sharedResources'
import type {
  SharedWorkerEvent,
  SSEMessage,
  ConnectedMessage,
  UpgradeMessage
} from 'src/workers/SharedWorker'
import { useIsOnline } from '@/hooks'

// Constants
const WORKER_SCRIPT_URL = '/workers/sharedSSEWorker.js'

interface SharedSSEWorkerContextType {
  subscribe: (eventTypes: string[], callback: (event: EventlogItem) => void) => () => void
}

export const SharedSSEWorkerContext = createContext<SharedSSEWorkerContextType | undefined>(undefined)

export const SharedSSEWorkerProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const workerRef = useRef<SharedWorker | null>(null)
  const subscribers = useRef<Record<string, ((data: EventlogItem) => void)[]>>({})
  const [connected, setConnected] = useState<boolean>(false)
  const isOnline = useIsOnline()

  /**
   * Loads the shared worker
   */
  const loadWorker = () => {
    const worker = new SharedWorker(WORKER_SCRIPT_URL)
    workerRef.current = worker

    worker.port.start()
    worker.port.addEventListener('message', onWorkerMessageEvent)

    return worker
  }

  /**
   * Send connection information to shared worker
   */
  const connectWorker = (worker: SharedWorker) => {
    if (!data?.accessToken) {
      return
    }

    worker.port.postMessage({
      type: 'connect',
      payload: {
        url: repositoryEventsUrl.toString(),
        accessToken: data?.accessToken || '',
        version: SharedSSEWorker.version
      }
    })
  }

  /**
   * Reset worker and mark it as disconnected to allow reload/upgrade
   */
  const resetWorker = (msg: UpgradeMessage) => {
    const version = msg.payload.version

    if (workerRef.current) {
      console.info(`Resetting shared worker to allow upgrade to version ${version}`)
      workerRef.current.port.close()
      workerRef.current = null
    }

    // Using magic number to allow connections to close, should not be
    // needed in normal circumstances, but recommended.
    setTimeout(() => {
      loadWorker()
    }, 250)
  }

  /**
   * Handles messages from the shared worker
   */
  const onWorkerMessageEvent = (event: SharedWorkerEvent) => {
    const msg = event.data

    switch (msg?.type) {
      case 'sse':
        onServerSentEvent(msg)
        break

      case 'disconnected':
        setConnected(false)
        break

      case 'connected':
        onConnected(msg)
        break

      case 'upgrade':
        resetWorker(msg)
        break

      case 'debug':
        console.debug(msg.payload.message, `(${msg.payload.clients})`)
        break

      default:
        console.warn('Received unknown message type from shared worker:', msg.type || 'unknown')
    }
  }

  /**
   * Notifies subscribers of incoming SSE messages
   */
  const onServerSentEvent = (msg: SSEMessage) => {
    const { payload: sseEvent } = msg
    subscribers.current[sseEvent.type]?.forEach((callback) => {
      callback(sseEvent)
    })
  }

  /**
   * When already connected we need to check for version mismatches
   */
  const onConnected = (msg: ConnectedMessage) => {
    if (msg.payload.version >= SharedSSEWorker.version) {
      setConnected(true)
      console.info(`Shared worker v${msg.payload.version} connected to event source`)
      return
    }

    console.info(`Shared worker running v${msg.payload.version} but require v${SharedSSEWorker.version}`)

    if (workerRef.current) {
      workerRef.current.port.postMessage({
        type: 'upgrade',
        payload: {
          version: SharedSSEWorker.version
        }
      })
    }
  }

  /**
   * Subscribe to worker events
   */
  const subscribe = useCallback((eventTypes: string[], callback: (data: EventlogItem) => void) => {
    for (const eventType of eventTypes) {
      subscribers.current[eventType] = [...(subscribers.current[eventType] || []), callback]
    }
    return () => {
      for (const eventType of eventTypes) {
        subscribers.current[eventType] = (subscribers.current[eventType] || []).filter((cb) => cb !== callback)
        if (subscribers.current[eventType].length === 0) {
          delete subscribers.current[eventType] // Cleanup empty event types
        }
      }
    }
  }, [])

  /**
   *  Worker Initialization and cleanup
   */
  useEffect(() => {
    const worker = loadWorker()

    return () => {
      worker.port.removeEventListener('message', onWorkerMessageEvent)
      worker.port.close()
    }
  }, [])

  /**
   * When not connected and browser is online, connect worker to event source
   */
  useEffect(() => {
    if (!workerRef.current || !repositoryEventsUrl || !data?.accessToken) {
      return
    }

    if (connected && !isOnline) {
      workerRef.current.port.postMessage({
        type: 'disconnect',
        payload: {}
      })
    }

    if (!connected && isOnline) {
      connectWorker(workerRef.current)
    }
  }, [connected, data?.accessToken, repositoryEventsUrl, isOnline])

  return (
    <SharedSSEWorkerContext.Provider value={{ subscribe }}>
      {children}
    </SharedSSEWorkerContext.Provider>
  )
}
