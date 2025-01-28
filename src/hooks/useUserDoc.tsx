import { useContext } from 'react'
import {
  UserTrackerContext
} from '@/contexts'
import { useYValue } from './useYValue'

export const useUser = <T,>(path: string): [T | undefined, (arg0: T) => void] => {
  const context = useContext(UserTrackerContext)
  const [user, setUser] = useYValue<T>(path, false, context.provider)

  if (!context) {
    throw new Error('useUserDoc must be used within a UserTrackerContextProvider')
  }

  return [user, setUser]
}
