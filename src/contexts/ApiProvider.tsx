import { createContext } from 'react'
import { WebSocketProvider } from './WebSocketProvider'

interface ApiProviderProps {
  children: React.ReactNode
  host?: string
  port?: number
}

export interface ApiProviderState {
  endpoint?: string
}

const initialState: ApiProviderState = {
  endpoint: undefined
}

export const ApiProvider = ({ children, host = 'localhost', port = 5183, ...props }: ApiProviderProps): JSX.Element => {
  const value = {
    endpoint: `${host}:${port}/api`
  }

  return (
    <ApiProviderContext.Provider {...props} value={value}>
      <WebSocketProvider endpoint={`ws://${value.endpoint}/ws`}>
        {children}
      </WebSocketProvider>
    </ApiProviderContext.Provider>
  )
}

export const ApiProviderContext = createContext<ApiProviderState>(initialState)
