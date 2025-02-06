import React, {
  createContext,
  useEffect,
  useRef,
  useCallback
} from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '../hooks'
import type { SWPostMessageEvent, SWMessage, SWDebugMessage, SWVersionMessage, SWSSEMessage } from '../types'
import type { EventlogItem } from '@ttab/elephant-api/repository'

// Constants
// ATTENTION: Shared worker version must match version in the actual shared worker js file
const SHARED_WORKER_VERSION = 1
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

  /**
   * Initializes the shared worker
   */
  const initializeWorker = () => {
    shutdownWorker() // Ensure clean restart

    workerRef.current = new SharedWorker(WORKER_SCRIPT_URL)
    const worker = workerRef.current

    worker.port.start()
    worker.port.addEventListener('message', onWorkerMessageEvent)
    return worker
  }

  /**
   * Gracefully shut down the shared worker
   */
  const shutdownWorker = () => {
    if (!workerRef.current) {
      return
    }

    console.warn('Shutting down shared worker')
    workerRef.current.port.postMessage({ type: 'shutdown' })
    workerRef.current.port.close()
    workerRef.current = null
  }

  /**
   * Handles messages from the shared worker
   */
  const onWorkerMessageEvent = (event: SWPostMessageEvent) => {
    const msg = event.data

    if (isSSEMessage(msg)) {
      notifySubscribers(msg)
    } else if (isSWVersionMessage(msg)) {
      handleVersionCheck(msg.payload)
    } else if (isDebugMessage(msg)) {
      console.debug(msg.payload)
    } else {
      console.warn('Received unknown message type from shared worker:', msg.type || 'unknown')
    }
  }

  /**
   * Notifies subscribers of incoming SSE messages
   */
  const notifySubscribers = (msg: SWSSEMessage) => {
    const { payload: sseEvent } = msg
    subscribers.current[sseEvent.type]?.forEach((callback) => {
      callback(sseEvent)
    })
  }

  /**
   * Handles worker version mismatches
   */
  const handleVersionCheck = (version: number) => {
    console.info(`Running sharedSSEWorker version ${version}`)

    if (version !== SHARED_WORKER_VERSION) {
      console.info(`Needs sharedSSEWorker version ${SHARED_WORKER_VERSION}, reloading`)
      shutdownWorker()

      setTimeout(() => {
        initializeWorker()
      }, 500)
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
   *  Worker Initialization
   */
  useEffect(() => {
    const worker = initializeWorker()

    return () => {
      worker.port.removeEventListener('message', onWorkerMessageEvent)
      shutdownWorker()
    }
  }, [])

  /**
   * Send Access Token to Worker
   */
  useEffect(() => {
    if (!workerRef.current || !data?.accessToken || !repositoryEventsUrl) return

    workerRef.current.port.postMessage({
      type: 'connect',
      payload: {
        url: repositoryEventsUrl.toString(),
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

// Type Guards
function isSSEMessage(msg: SWMessage): msg is SWSSEMessage {
  return msg.type === 'sse'
}

function isSWVersionMessage(msg: SWMessage): msg is SWVersionMessage {
  return msg.type === 'version'
}

function isDebugMessage(msg: SWMessage): msg is SWDebugMessage {
  return msg.type === 'debug'
}
