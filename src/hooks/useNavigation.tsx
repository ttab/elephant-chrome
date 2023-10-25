import { type Dispatch, useContext } from 'react'
import { NavigationContext } from '../contexts/NavigationProvider'
import type { NavigationAction, NavigationState } from '@/types'

export const useNavigation = (): { state: NavigationState | null, dispatch: Dispatch<NavigationAction> } => (
  useContext(NavigationContext)
)
