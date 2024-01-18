import { useContext } from 'react'
import {
  CollaborationContext,
  type CollaborationProviderState
} from '@/contexts'

export const useCollaboration = (): CollaborationProviderState => {
  const context = useContext(CollaborationContext)

  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationContextProvider')
  }

  return context
}
