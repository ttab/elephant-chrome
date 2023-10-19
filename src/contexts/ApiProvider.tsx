import { createContext, useEffect, useRef } from 'react'

interface ApiProviderProps {
  children: React.ReactNode
  host?: string
  port?: number
}

export interface ApiProviderState {
  apiUrl?: string
  send?: (msg: string) => void
}

const initialState: ApiProviderState = {
  apiUrl: undefined,
  send: undefined
}

export const ApiProvider = ({ children, host = 'localhost', port = 5183, ...props }: ApiProviderProps): JSX.Element => {
  const wsRef = useRef<WebSocket | undefined>(undefined)

  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocket(`ws://${host}:${port}/api/ws`)

      wsRef.current.addEventListener('open', () => {
        console.log('WebSocket connection opened')
      })

      wsRef.current.addEventListener('message', (event) => {
        console.log('Received message:', event.data)
      })
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [host, port])

  const value = {
    apiUrl: `${host}:${port}/api`,
    send: (msg: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(msg)
      }
    }
  }

  return (
    <ApiProviderContext.Provider {...props} value={value}>
      {children}
    </ApiProviderContext.Provider>
  )
}

export const ApiProviderContext = createContext<ApiProviderState>(initialState)
