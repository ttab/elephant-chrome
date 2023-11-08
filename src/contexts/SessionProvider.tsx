import { createContext, useEffect, useState } from 'react'
import { type JWT } from '@/types'

// export type SessionProviderState = [
//   JWT | undefined,
//   (jwt: JWT) => void
// ]

export interface SessionProviderState {
  session?: {
    jwtToken: string
    jwt: JWT
  }
  setJwtToken: (token: string) => void
}

export const SessionProviderContext = createContext<SessionProviderState>({
  session: undefined,
  setJwtToken: () => { }
})

export const SessionProvider = ({ children, endpoint }: {
  children: React.ReactNode
  endpoint: string
}): JSX.Element => {
  const [session, setSession] = useState<{ jwtToken: string, jwt: JWT } | undefined>(undefined)

  useEffect(() => {
    const fetchToken = async (): Promise<void> => {
      const result = await fetchOrRefreshToken(endpoint)
      if (result) {
        setSession({
          jwtToken: result,
          jwt: JSON.parse(result)
        })
      } else {
        setSession(undefined)
      }
    }

    const { jwt = undefined } = session || {}
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
  }, [session, endpoint])

  const value: SessionProviderState = {
    session,
    setJwtToken: jwtToken => {
      setSession(!jwtToken
        ? undefined
        : { jwtToken, jwt: JSON.parse(jwtToken) }
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
