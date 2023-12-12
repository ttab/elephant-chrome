import { useContext } from 'react'
import { type RegistryProviderState, RegistryContext } from '../contexts/RegistryProvider'

/**
 * Registry hook
 *
 * @returns RegistryProviderState
 */
export const useRegistry = (): RegistryProviderState => {
  const context = useContext(RegistryContext)

  if (!context) {
    throw new Error('useRegistry must be used within a RegistryProvider')
  }
  return context
}
