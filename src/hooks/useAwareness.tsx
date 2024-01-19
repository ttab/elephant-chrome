import { useEffect, useState } from 'react'
import { useCollaboration } from './useCollaboration'
import {
  type AwarenessStates
} from '@/contexts/CollaborationProvider'

type AwarenessState = [
  AwarenessStates, // value
  (value: boolean) => void // set value
]

export const useAwareness = (name: string): AwarenessState => {
  const { provider, states, user } = useCollaboration()
  const [value, setValue] = useState<AwarenessStates>([])
  const localClientId = provider?.configuration?.awareness?.clientID

  useEffect(() => {
    const remoteStates = states
      .filter(({ clientId, focus }) => {
        if (!focus) {
          return false
        }

        return focus?.key === name && clientId !== localClientId
      })

    if (!remoteStates.length && value.length) {
      setValue([])
    } else if (remoteStates.length && !value.length) {
      setValue(remoteStates)
    }
  }, [name, value, states, localClientId])

  return [
    value,
    (newValue) => {
      provider?.setAwarenessField('focus', newValue ? { key: name, color: user.color } : undefined)
    }
  ]
}
