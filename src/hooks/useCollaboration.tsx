import { useContext } from 'react'
import {
  CollaborationContext,
  type CollaborationProviderState
} from '../contexts/CollaborationProvider'

export const useCollaboration = (): CollaborationProviderState => {
  const context = useContext(CollaborationContext)

  if (!context) {
    throw new Error('useTextbitContext must be used within a TextbitContextProvider')
  }

  return context
}
