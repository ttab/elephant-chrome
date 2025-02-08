import React, {
  createContext,
  useEffect,
  useRef,
  useCallback
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

// Constants
const WORKER_SCRIPT_URL = '/workers/sharedSSEWorker.js'

// Keep track of current version
let currentVersion = SharedSSEWorker.version

interface SharedSSEWorkerContextType {
  subscribe: (eventTypes: string[], callback: (event: EventlogItem) => void) => () => void
}

export const SharedSSEWorkerContext = createContext<SharedSSEWorkerContextType | undefined>(undefined)

export const SharedSSEWorkerProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const sessionRef = useRef(data)
  const workerRef = useRef<SharedWorker | null>(null)
  const subscribers = useRef<Record<string, ((data: EventlogItem) => void)[]>>({})

  /**
   * Initializes the shared worker
   */
  const loadWorker = () => {
    workerRef.current = new SharedWorker(WORKER_SCRIPT_URL)
    const worker = workerRef.current

    worker.port.start()
    worker.port.addEventListener('message', onWorkerMessageEvent)
    return worker
  }

  /**
   * Tell the worker to tell others to reload
   */
  const upgradeWorker = (msg: UpgradeMessage) => {
    const version = msg.payload.version

    if (workerRef.current) {
      console.info(`Reloading shared worker with new version ${version}`)
      workerRef.current.port.close()
      workerRef.current = null
    }

    currentVersion = version

    setTimeout(() => {
      const worker = loadWorker()
      worker.port.postMessage({
        type: 'connect',
        payload: {
          url: repositoryEventsUrl.toString(),
          accessToken: sessionRef.current?.accessToken || '',
          version: currentVersion
        }
      })
    }, 500)
  }

  /**
   * Handles messages from the shared worker
   */
  const onWorkerMessageEvent = (event: SharedWorkerEvent) => {
    const msg = event.data

    switch (msg?.type) {
      case 'sse':
        console.log(msg.payload)
        onServerSentEvent(msg)
        break

      case 'connected':
        onConnected(msg)
        break

      case 'notconnected':
        onNotConnected()
        break

      case 'upgrade':
        setTimeout(() => {
          upgradeWorker(msg)
        }, 500)
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
    const version = msg.payload.version

    if (currentVersion === version) {
      console.debug(`Connected to shared worker v${msg.payload.version}`)
      return
    }

    console.info(`Shared worker running v${version} but require v${SharedSSEWorker.version}`)

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
   * When not connected we need to send connection information
   */
  const onNotConnected = () => {
    if (!workerRef.current) {
      return
    }

    workerRef.current.port.postMessage({
      type: 'connect',
      payload: {
        version: currentVersion,
        url: repositoryEventsUrl.toString(),
        accessToken: sessionRef.current?.accessToken || ''
      }
    })
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
   * Send access token to shared worker when it changes
   */
  useEffect(() => {
    if (!workerRef.current || !data?.accessToken || !repositoryEventsUrl) {
      return
    }

    sessionRef.current = data
    workerRef.current.port.postMessage({
      type: 'accessToken',
      payload: {
        accessToken: data?.accessToken || ''
      }
    })
  }, [data?.accessToken, repositoryEventsUrl])

  return (
    <SharedSSEWorkerContext.Provider value={{ subscribe }}>
      {children}
    </SharedSSEWorkerContext.Provider>
  )
}
