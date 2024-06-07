import { useSession } from 'next-auth/react'
import { createContext } from 'react'
import { type JWT } from '@/types'

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
  const session = useSession()

  console.log('SessionProvider', session)

  const value = {} as SessionProviderState
  return (
    <SessionProviderContext.Provider value={value}>
      {children}
    </SessionProviderContext.Provider>
  )
}
