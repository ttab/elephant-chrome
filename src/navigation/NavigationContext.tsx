import {
  createContext,
  type Dispatch
} from 'react'
import type { NavigationState, NavigationAction } from '@/types'

import { initializeNavigationState } from '@/navigation/lib'

const initialState = initializeNavigationState()

export const NavigationContext = createContext<{
  state: NavigationState
  dispatch: Dispatch<NavigationAction>
}>({
  state: initialState,
  dispatch: () => { }
})
