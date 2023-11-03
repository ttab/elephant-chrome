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

export const WebSocketProvider = ({ children, endpoint: websocketUrl, ...props }: WebSocketProviderProps): JSX.Element => {
  const wsRef = useRef<WebSocket | undefined>(undefined)

  useEffect(() => {
    if (!wsRef.current && websocketUrl?.substring(0, 5) === 'ws://') {
      wsRef.current = new WebSocket(websocketUrl)

      wsRef.current.addEventListener('open', () => {
        console.info(`WebSocket connection opened to ${websocketUrl}`)
      })
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [websocketUrl])

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
