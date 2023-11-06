import { createContext, useEffect, useState } from 'react'
import { type JWT } from '@/types'

export type SessionProviderState = [
  JWT | undefined,
  (jwt: JWT) => void
]

export const SessionProviderContext = createContext<SessionProviderState>([
  undefined,
  () => { }
])

export const SessionProvider = ({ children, endpoint }: {
  children: React.ReactNode
  endpoint: string
}): JSX.Element => {
  const [jwt, setJwt] = useState<JWT | undefined>(undefined)

  useEffect(() => {
    const fetchToken = async (): Promise<void> => {
      setJwt(await fetchOrRefreshToken(endpoint))
    }

    if (!jwt?.exp) {
      void fetchToken()
      return
    }

    // FIXME: It seems server jwt.exp is set to current time, not a future time
    const timeoutRef = setTimeout(() => {
      void fetchToken()
    }, 60000 * 5) // Set timeout to refresh token when 9 mins have passed (should use jwt.exp)

    return () => {
      clearTimeout(timeoutRef)
    }
  }, [jwt, endpoint])

  const value: SessionProviderState = [
    jwt,
    (jwt: JWT): void => {
      setJwt(jwt)
    }
  ]

  return (
    <SessionProviderContext.Provider value={value}>
      {children}
    </SessionProviderContext.Provider>
  )
}


async function fetchOrRefreshToken(endpoint: string): Promise<JWT | undefined> {
  try {
    const response = await fetch(`${endpoint}`, {
      credentials: 'include'
    })

    if (response.status === 401) {
      return undefined
    }

    if (!response.ok) {
      console.error(`Fetching session return status ${response.status}`)
      return undefined
    }

    const jwt = await response.json() || undefined
    return jwt
  } catch (error) {
    console.error('Unable to retrieve session', error)
    return undefined
  }
}
