import React, {
  createContext,
  useEffect,
  useRef,
  useCallback
} from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '../hooks'
import type { SWPostMessageEvent, SWSSEMessage } from '../types'
import type { EventlogItem } from '@ttab/elephant-api/repository'
import { SharedSSEWorker } from '@/defaults/sharedResources'

// Constants
const WORKER_SCRIPT_URL = '/workers/sharedSSEWorker.js'
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
  const initializeWorker = () => {
    workerRef.current = new SharedWorker(WORKER_SCRIPT_URL)
    const worker = workerRef.current

    worker.port.start()
    worker.port.addEventListener('message', onWorkerMessageEvent)
    return worker
  }

  /**
   * Tell the worker to tell others to reload
   */
  const reloadWorker = (version: number) => {
    if (workerRef.current) {
      console.info(`Reloading shared worker with new version ${version}`)
      workerRef.current.port.close()
      workerRef.current = null
    }

    currentVersion = version
    const worker = initializeWorker()

    worker.port.postMessage({
      type: 'connect',
      payload: {
        url: repositoryEventsUrl.toString(),
        accessToken: sessionRef.current?.accessToken || ''
      }
    })
  }

  /**
   * Handles messages from the shared worker
   */
  const onWorkerMessageEvent = (event: SWPostMessageEvent) => {
    const msg = event.data

    switch (msg.type) {
      case 'sse':
        console.log(msg.payload)
        onServerSentEvent(msg)
        break

      case 'connected':
        onConnected(msg.payload)
        break

      case 'reload':
        setTimeout(() => {
          reloadWorker(msg.payload)
        }, 500)
        break

      case 'debug':
        break

      default:
        console.warn('Received unknown message type from shared worker:', msg.type || 'unknown')
    }
  }

  /**
   * Notifies subscribers of incoming SSE messages
   */
  const onServerSentEvent = (msg: SWSSEMessage) => {
    const { payload: sseEvent } = msg
    subscribers.current[sseEvent.type]?.forEach((callback) => {
      callback(sseEvent)
    })
  }

  /**
   * Handles worker version mismatches
   */
  const onConnected = (version: number) => {
    if (version === currentVersion) {
      console.info(`Running sharedSSEWorker version ${version}`)
      return
    }

    console.info(`SharedSSEWorker version mismatch, running v${version} but require v${SharedSSEWorker.version}`)

    if (workerRef.current) {
      console.info('Telling shared worker to shutdown and tell clients to load new version')

      workerRef.current.port.postMessage({
        type: 'reload',
        payload: SharedSSEWorker.version
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
    const worker = initializeWorker()

    return () => {
      worker.port.removeEventListener('message', onWorkerMessageEvent)
      worker.port.close()
    }
  }, [])

  /**
   * Send Access Token to Worker
   */
  useEffect(() => {
    if (!workerRef.current || !data?.accessToken || !repositoryEventsUrl) return

    sessionRef.current = data
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
