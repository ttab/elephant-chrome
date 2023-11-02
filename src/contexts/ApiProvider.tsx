import { createContext, useEffect, useState } from 'react'
import { WebSocketProvider } from './WebSocketProvider'
import { type ElephantJwt } from '@/types'

interface ApiProviderProps {
  children: React.ReactNode
  protocol: string
  host: string
  port: number
}

export interface ApiProviderState {
  api?: string
  ws?: string
  jwt?: ElephantJwt
}

export const ApiProviderContext = createContext<ApiProviderState>({
  api: undefined,
  ws: undefined,
  jwt: undefined
})

export const ApiProvider = (params: ApiProviderProps): JSX.Element => {
  const {
    children,
    protocol,
    host = 'localhost',
    port = 5183,
    ...props
  } = params

  const [jwt, setJwt] = useState<ElephantJwt | undefined>(undefined)

  const value = {
    api: `${protocol}://${host}:${port}/api`,
    ws: host && port ? `ws://${host}:${port}/ws` : undefined,
    jwt
  }

  useEffect(() => {
    fetchToken(value.api)
      .then(payload => {
        setJwt(payload)
      })
      .catch(error => {
        console.error('Error when fetching JWT token', error)
        setJwt(undefined)
      })
  }, [value.api])

  return (
    <ApiProviderContext.Provider {...props} value={value}>
      <WebSocketProvider endpoint={`${value.ws}`}>
        {children}
      </WebSocketProvider>
    </ApiProviderContext.Provider>
  )
}


async function fetchToken(endpoint: string): Promise<ElephantJwt | undefined> {
  try {
    const response = await fetch(`${endpoint}/user`, {
      credentials: 'include'
    })

    if (response.status === 401) {
      return undefined
    }

    if (!response.ok) {
      throw new Error(`Fetching session return status ${response.status}`)
    }

    return await response.json() || undefined
  } catch (error) {
    console.error('Unable to retrieve session', error)
  }
}
