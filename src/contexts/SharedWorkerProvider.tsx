import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  ReactNode
} from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '../hooks'


interface SharedWorkerMsg {
  type: 'connect' | 'debug' | 'sse'
  payload?: unknown
}

interface SSEMsg {
  type: string
  [key: string]: unknown
}

interface SharedWorkerContextType {
  subscribe: (eventType: string, callback: (event: SharedWorkerMsg) => void) => () => void
}


export const SharedWorkerContext = createContext<SharedWorkerContextType | undefined>(undefined)


export const SharedWorkerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const workerRef = useRef<SharedWorker | null>(null)
  const [listeners, setListeners] = useState<Record<string, Set<(event: SharedWorkerMsg) => void>>>({})

  //
  // Initialize shared worker and listen for messages
  //
  useEffect(() => {
    workerRef.current = new SharedWorker('/shared-worker.js')
    const worker = workerRef.current
    worker.port.start()

    const handleMessage = (event: MessageEvent) => {
      const msg: SharedWorkerMsg = event.data

      if (msg.type === 'sse') {
        const data = msg.payload as SSEMsg
        const eventListeners = listeners[data.type]

        console.log(msg)
        if (eventListeners) {
          eventListeners.forEach(callback => callback(msg))
        }
      } else {
        console.debug(msg.payload)
      }
    }

    worker.port.addEventListener('message', handleMessage)

    return () => {
      worker.port.removeEventListener('message', handleMessage)
      worker.port.close()
    }
  }, [listeners])


  //
  // Update access token so the shared worker can listen to events
  //
  useEffect(() => {
    if (!workerRef?.current || !data?.accessToken || !repositoryEventsUrl) {
      return
    }

    const worker = workerRef.current
    worker.port.postMessage({
      type: 'connect',
      payload: {
        url: repositoryEventsUrl.toString(),
        accessToken: data?.accessToken || ''
      }
    })
  }, [data?.accessToken, repositoryEventsUrl, workerRef?.current])


  const subscribe = (eventType: string, callback: (event: SharedWorkerMsg) => void) => {
    setListeners(prev => {
      const newListeners = { ...prev }
      if (!newListeners[eventType]) {
        newListeners[eventType] = new Set()
      }
      newListeners[eventType].add(callback)
      return newListeners
    })

    return () => {
      setListeners(prev => {
        const newListeners = { ...prev }
        newListeners[eventType]?.delete(callback)
        return newListeners
      })
    }
  }

  return (
    <SharedWorkerContext.Provider value={{ subscribe }}>
      {children}
    </SharedWorkerContext.Provider>
  )
}
