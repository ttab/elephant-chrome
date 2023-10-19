import { useContext } from 'react'
import { ApiProviderContext, type ApiProviderState } from '@/contexts/ApiProvider'

export const useApi = (): ApiProviderState => {
  const context = useContext(ApiProviderContext)

  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider')
  }

  return context
}
