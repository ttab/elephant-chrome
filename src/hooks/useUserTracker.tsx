import { useContext } from 'react'
import {
  UserTrackerContext
} from '@/contexts'
import { useYValue } from './useYValue'

export const useUserTracker = <T,>(path: string): [T | undefined, (arg0: T) => void, boolean] => {
  const context = useContext(UserTrackerContext)
  const [user, setUser] = useYValue<T>(path, false, context.provider)
  const synced = !!context.provider?.synced

  if (!context) {
    throw new Error('useUserTracker must be used within a UserTrackerContextProvider')
  }

  return [user, setUser, synced]
}
