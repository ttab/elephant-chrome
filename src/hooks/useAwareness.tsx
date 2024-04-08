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
  const { provider, user } = useCollaboration()
  const [value, setValue] = useState<AwarenessStates>([])

  useEffect(() => {
    provider?.on('awarenessUpdate', ({ states }: { states: AwarenessStates }) => {
      const localClientId = provider?.configuration?.awareness?.clientID

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
    })
  }, [key, value, provider])

  return [
    value,
    (newValue) => {
      provider?.setAwarenessField('focus', newValue ? { key, color: user.color } : undefined)
    }
  ]
}
