import { useContext } from 'react'
import { ClientRegistryContext } from '../contexts/ClientRegistryContext'
import type { CollaborationClientRegistry } from '../classes/CollaborationClientRegistry'

export function useClientRegistry(): CollaborationClientRegistry | null {
  const context = useContext(ClientRegistryContext)

  if (context === undefined) {
    throw new Error('useWebSocket must be used within a ClientRegistryProvider')
  }

  return context.registry
}
