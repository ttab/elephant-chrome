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

      const remoteStates = states.filter(({ clientId, focus }) => {
        return (!focus)
          ? false
          : focus?.key === key && clientId !== localClientId
      })

      setValue((prev) => {
        return JSON.stringify(prev) === JSON.stringify(remoteStates) ? prev : remoteStates
      })
    })
  }, [key, provider])

  return [
    value,
    (newValue) => {
      provider?.setAwarenessField('focus', newValue ? { key, color: user.color } : undefined)
    }
  ]
}
