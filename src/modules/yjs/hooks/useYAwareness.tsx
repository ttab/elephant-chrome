import { useCallback, useEffect, useState } from 'react'
import type { YDocument } from './useYDocument'

export interface YAwarenessUser extends Record<string, unknown> {
  name: string
  color?: string
  avatar?: string
  initials?: string
}

export interface YAwarenessFocus {
  key: string
  path?: string
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

// We need this to be <any> as it's a generic type and awareness don't care about the type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useYAwareness = (ydoc: YDocument<any>, key: string): YAwarenessState => {
  const [value, setValue] = useState<YAwarenessObject[]>([])
  const { provider } = ydoc

  useEffect(() => {
    if (!provider) return

    const awareness = provider.awareness
    if (!awareness) return

    const updateAwareness = () => {
      const localClientId = awareness.clientID
      const states = awareness.getStates()
      const remoteStates: YAwarenessObject[] = []

      states.forEach((state, clientId: number) => {
        // Skip local client and clients without user data
        if (clientId === localClientId || !state.data) return

        remoteStates.push({
          clientId,
          data: state.data as YAwarenessUser,
          focus: state.focus as YAwarenessFocus
        })
      })

      setValue(remoteStates)
    }

    // Initialize
    updateAwareness()

    // Listen for updates
    const handler = () => {
      updateAwareness()
    }

    awareness.on('change', handler)

    return () => {
      awareness.off('change', handler)
    }
  }, [key, provider])

  const setIsFocused = useCallback((focused: boolean, path?: string) => {
    if (!provider?.awareness) return

    provider.setAwarenessField('focus', focused ? { key, path } : null)
  }, [key, provider])

  return [value, setIsFocused]
}
