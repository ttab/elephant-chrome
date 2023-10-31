import { useContext } from 'react'
import { ApiProviderContext } from '@/contexts'
import { type JWTPayload } from 'jose'

export const useSession = (): JWTPayload | undefined => {
  const context = useContext(ApiProviderContext)

  if (context === undefined) {
    throw new Error('useSession() must be used with an ApiProvider')
  }

  return context.jwt
}
