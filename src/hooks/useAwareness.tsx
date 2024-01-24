import { useEffect, useState } from 'react'
import { useCollaboration } from './useCollaboration'
import {
  type AwarenessStates
} from '@/contexts/CollaborationProvider'

type AwarenessState = [
  AwarenessStates, // value
  (value: boolean) => void // set value
]

export const useAwareness = (key: string): AwarenessState => {
  const { provider, states, user } = useCollaboration()
  const [value, setValue] = useState<AwarenessStates>([])
  const localClientId = provider?.configuration?.awareness?.clientID

  useEffect(() => {
    const remoteStates = states
      .filter(({ clientId, focus }) => {
        if (!focus) {
          return false
        }
        return focus?.key === key && clientId !== localClientId
      })

    if (!remoteStates.length && value.length) {
      setValue([])
    } else if (remoteStates.length && !value.length) {
      setValue(remoteStates)
    }
  }, [key, value, states, localClientId])

  return [
    value,
    (newValue) => {
      provider?.setAwarenessField('focus', newValue ? { key, color: user.color } : undefined)
    }
  ]
}
