import {
  type MutableRefObject,
  createContext,
  useEffect,
  useRef
} from 'react'

interface WebSocketProviderProps {
  children: React.ReactNode
  endpoint?: string
}

export interface WebSocketProviderState {
  webSocket?: MutableRefObject<WebSocket | undefined>
  // send?: (msg: string) => void
}

const initialState: WebSocketProviderState = {}

export const WebSocketProvider = ({ children, endpoint, ...props }: WebSocketProviderProps): JSX.Element => {
  const wsRef = useRef<WebSocket | undefined>(undefined)

  console.log('ENDPOINT: ', endpoint?.substring(0, 5))
  useEffect(() => {
    if (!wsRef.current && endpoint?.substring(0, 5) === 'ws://') {
      wsRef.current = new WebSocket(endpoint)

      wsRef.current.addEventListener('open', () => {
        console.log('WebSocket connection opened')
      })

      wsRef.current.addEventListener('message', (event) => {
        console.log('Received message -:', event.data)
      })
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [endpoint])

  const value = {
    webSocket: wsRef
    // send: (msg: string) => {
    //   if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    //     wsRef.current.send(msg)
    //   }
    // }
  }

  return (
    <WebSocketProviderContext.Provider {...props} value={value}>
      {children}
    </WebSocketProviderContext.Provider>
  )
}

export const WebSocketProviderContext = createContext<WebSocketProviderState>(initialState)
