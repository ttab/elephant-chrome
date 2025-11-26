import { createContext } from 'react'
import type { CollaborationClientRegistry } from '../classes/CollaborationClientRegistry'

export interface ClientRegistryContextType {
  registry: CollaborationClientRegistry | null
}

export const ClientRegistryContext = createContext<ClientRegistryContextType>({
  registry: null
})
