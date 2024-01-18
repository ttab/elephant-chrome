import { useEffect, useState } from 'react'
import { useCollaboration } from './useCollaboration'

interface AwarenessFocus {
  key: string
  color: string
}

type AwarenessState = [
  AwarenessFocus | undefined, // value
  (value: boolean) => void // set value
]

export const useAwareness = (key: string): AwarenessState => {
  const { provider, states, user } = useCollaboration()
  const [value, setValue] = useState<AwarenessFocus | undefined>(undefined)
  const clientId = provider?.configuration?.awareness?.clientID

  useEffect(() => {
    const remoteState = states.find(state => state?.focus?.key === key && state.clientId !== clientId)

    if (remoteState?.focus && !value?.key) {
      setValue({ ...remoteState.focus })
    } else if (!remoteState?.focus && value?.key) {
      setValue(undefined)
    }
  }, [key, value, states, clientId])

  return [
    value,
    (newValue) => {
      provider?.setAwarenessField('focus', newValue ? { key, color: user.color } : undefined)
    }
  ]
}
