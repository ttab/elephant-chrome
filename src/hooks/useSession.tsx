import { useContext } from 'react'
import { SessionProviderContext } from '@/contexts'
import { type SessionProviderState } from '@/contexts/SessionProvider'

export const useSession = (): SessionProviderState => {
  const context = useContext(SessionProviderContext)

  if (context === undefined) {
    throw new Error('useSession() must be used with a SessionProvider')
  }

  return context
}
