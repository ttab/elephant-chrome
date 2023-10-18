import { useContext } from 'react'
import { type NavigationState, NavigationContext } from '../contexts/NavigationProvider'

export function useNavigation(): React.Context<NavigationState> {
  return useContext(NavigationContext)
}
