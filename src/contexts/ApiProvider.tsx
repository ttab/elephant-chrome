import { createContext } from 'react'
import { WebSocketProvider } from './WebSocketProvider'
import type { ElephantSession } from '@/hooks/useSession'
import type { JWTPayload } from 'jose'

interface ApiProviderProps {
  children: React.ReactNode
  protocol: string
  host: string
  port: number
  session?: ElephantSession
}

export interface ApiProviderState {
  api?: string
  ws?: string
  jwt?: JWTPayload
}

const initialState: ApiProviderState = {
  api: undefined,
  ws: undefined,
  jwt: undefined
}

export const ApiProvider = (params: ApiProviderProps): JSX.Element => {
  const {
    children,
    protocol,
    host = 'localhost',
    port = 5183,
    session = undefined,
    ...props
  } = params

  const value = {
    api: `${protocol}://${host}:${port}/api`,
    ws: host && port ? `ws://${host}:${port}/ws` : undefined,
    jwt: session?.jwt
  }

  return (
    <ApiProviderContext.Provider {...props} value={value}>
      <WebSocketProvider endpoint={`${value.ws}`}>
        {children}
      </WebSocketProvider>
    </ApiProviderContext.Provider>
  )
}

export const ApiProviderContext = createContext<ApiProviderState>(initialState)
