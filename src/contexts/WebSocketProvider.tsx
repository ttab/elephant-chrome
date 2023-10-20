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
}

const initialState: WebSocketProviderState = {}

export const WebSocketProvider = ({ children, endpoint, ...props }: WebSocketProviderProps): JSX.Element => {
  const wsRef = useRef<WebSocket | undefined>(undefined)

  useEffect(() => {
    if (!wsRef.current && endpoint?.substring(0, 5) === 'ws://') {
      wsRef.current = new WebSocket(endpoint)

      wsRef.current.addEventListener('open', () => {
        console.info(`WebSocket connection opened to ${endpoint}`)
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
  }

  return (
    <WebSocketProviderContext.Provider {...props} value={value}>
      {children}
    </WebSocketProviderContext.Provider>
  )
}

export const WebSocketProviderContext = createContext<WebSocketProviderState>(initialState)
