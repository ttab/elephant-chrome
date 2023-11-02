import { useContext } from 'react'
import { ApiProviderContext } from '@/contexts'
import { type ElephantJwt } from '@/types'

export const useSession = (): ElephantJwt | undefined => {
  const context = useContext(ApiProviderContext)

  if (context === undefined) {
    throw new Error('useSession() must be used with an ApiProvider')
  }

  return context.jwt
}
