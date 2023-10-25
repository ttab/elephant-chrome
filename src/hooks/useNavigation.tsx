import { type Dispatch, useContext } from 'react'
import { NavigationContext } from '../contexts/NavigationProvider'
import type { NavigationAction, NavigationState } from '@/types'

export const useNavigation = (): { state: NavigationState, dispatch: Dispatch<NavigationAction> } => {
  const context = useContext(NavigationContext)

  if (context === undefined) { throw new Error('useNavigation must be used within a NavigationProvider') }

  return context
}
