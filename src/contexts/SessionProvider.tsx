import { createContext, useEffect, useState } from 'react'
import { type JWT } from '@/types'

export interface SessionProviderState {
  jwt?: JWT
  setJwt: (token: string) => void
}

export const SessionProviderContext = createContext<SessionProviderState>({
  jwt: undefined,
  setJwt: () => { }
})

export const SessionProvider = ({ children, endpoint }: {
  children: React.ReactNode
  endpoint: URL
}): JSX.Element => {
  const [jwt, setJwt] = useState<JWT | undefined>(undefined)

  useEffect(() => {
    const fetchToken = async (): Promise<void> => {
      const result = await fetchOrRefreshToken(endpoint.href)

      if (result) {
        setJwt(JSON.parse(result))
      } else {
        setJwt(undefined)
      }
    }

    if (!jwt?.exp) {
      void fetchToken()
      return
    }

    // FIXME: It seems server jwt.exp is set to current time, not a future time
    const timeoutRef = setTimeout(() => {
      void fetchToken()
    }, 60000 * 5) // Set timeout to refresh token when N mins have passed (should use jwt.exp)

    return () => {
      clearTimeout(timeoutRef)
    }
  }, [jwt, endpoint])

  const value: SessionProviderState = {
    jwt,
    setJwt: jwtToken => {
      setJwt(!jwtToken
        ? undefined
        : JSON.parse(jwtToken)
      )
    }
  }

  return (
    <SessionProviderContext.Provider value={value}>
      {children}
    </SessionProviderContext.Provider>
  )
}


async function fetchOrRefreshToken(endpoint: string): Promise<string | undefined> {
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

    return await response.text()
  } catch (error) {
    console.error('Unable to retrieve session', error)
    return undefined
  }
}
