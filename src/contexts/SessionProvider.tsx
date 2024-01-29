import { createContext, useEffect, useState } from 'react'
import { type JWT } from '@/types'
import { authRefresh } from '@/lib/authRefresh'

export interface SessionProviderState {
  jwt?: JWT
  setJwt: (jwt: JWT | undefined) => void
}

export const SessionProviderContext = createContext<SessionProviderState>({
  jwt: undefined,
  setJwt: () => { }
})

export const SessionProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const [jwt, setJwt] = useState<JWT | undefined>(undefined)

  useEffect(() => {
    // FIXME: It seems server jwt.exp is set to current time, not a future time
    const timeoutRef = setInterval(() => {
      authRefresh()
        .then(setJwt)
        .catch(() => {
          setJwt(undefined)
        })
    }, 60000 * 5) // Set timeout to refresh token when N mins have passed (should use jwt.exp)

    return () => {
      clearInterval(timeoutRef)
    }
  }, [jwt])

  useEffect(() => {
    // Initialize by checking if we can update token
    authRefresh()
      .then(setJwt)
      .catch(() => {
        setJwt(undefined)
      })
  }, [])

  const value: SessionProviderState = {
    jwt,
    setJwt
  }

  return (
    <SessionProviderContext.Provider value={value}>
      {children}
    </SessionProviderContext.Provider>
  )
}
