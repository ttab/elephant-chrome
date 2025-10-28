import { useContext } from 'react'
import {
  UserTrackerContext
} from '@/contexts'
import { useYValue } from '@/modules/yjs/hooks'

export const useUserTracker = <T,>(path: string): [T | undefined, (arg0: T) => void, boolean] => {
  const context = useContext(UserTrackerContext)
  const ele = context.provider?.document.getMap('ele')
  const [user, setUser] = useYValue<T>(ele, path)
  const synced = !!context.provider?.synced

  if (!context) {
    throw new Error('useUserTracker must be used within a UserTrackerContextProvider')
  }

  return [user, setUser, synced]
}
