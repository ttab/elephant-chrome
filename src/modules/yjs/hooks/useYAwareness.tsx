import { useCallback, useEffect, useState } from 'react'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export interface YAwarenessUser extends Record<string, unknown> {
  name: string
  initials: string
  color: string
  avatar?: string
}

interface YAwarenessFocus {
  key: string
  path?: string
  color: string
}

export interface YAwarenessObject {
  clientId: number
  data: YAwarenessUser
  focus?: YAwarenessFocus
}

export type YAwarenessState = [
  YAwarenessObject[],
  (value: boolean, path?: string) => void
]


export const useYAwareness = (
  ydoc: {
    provider: HocuspocusProvider | null
    user: YAwarenessUser | null
  }, key: string): YAwarenessState => {
  const [value, setValue] = useState<YAwarenessObject[]>([])
  const { provider, user } = ydoc

  useEffect(() => {
    if (!provider) return

    // Initialize with current awareness state
    const awareness = provider.configuration?.awareness
    if (awareness) {
      const localClientId = awareness.clientID
      const currentStates: YAwarenessObject[] = Array.from(awareness.getStates().entries()).map(([clientId, state]) => ({
        clientId,
        data: (state).data as YAwarenessUser,
        focus: (state).focus as YAwarenessFocus
      }))

      const remoteStates = currentStates.filter(({ clientId, focus }) => {
        return focus && focus?.key === key && clientId !== localClientId
      })

      setValue(remoteStates)
    }

    // Then listen for updates
    const handler = ({ states }: { states: YAwarenessObject[] }) => {
      const localClientId = provider?.configuration?.awareness?.clientID
      const remoteStates = states.filter(({ clientId, focus }) => {
        return (!focus) ? false : focus?.key === key && clientId !== localClientId
      })
      setValue((prev) => {
        return JSON.stringify(prev) === JSON.stringify(remoteStates) ? prev : remoteStates
      })
    }

    provider.on('awarenessUpdate', handler)

    return () => {
      provider.off('awarenessUpdate', handler)
    }
  }, [key, provider])

  const setIsFocused = useCallback((value: boolean, path?: string) => {
    provider?.setAwarenessField('focus', value ? { key, color: user?.color, path } : undefined)
  }, [key, provider, user?.color])

  return [
    value,
    setIsFocused
  ]
}
