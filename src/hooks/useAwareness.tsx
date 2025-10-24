import { useCallback, useEffect, useState } from 'react'
import {
  type AwarenessStates
} from '@/contexts/CollaborationProvider'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

type AwarenessState = [
  AwarenessStates,
  (value: boolean, path?: string) => void
]
/**
 * @deprecated - use useYAwareness() hook from yjs module
 */
export const useAwareness = (ydoc: YDocument<Y.Map<unknown>>, key: string): AwarenessState => {
  const [value, setValue] = useState<AwarenessStates>([])
  const { provider, user } = ydoc

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

  const setIsFocused = useCallback((value: boolean, path?: string) => {
    provider?.setAwarenessField('focus', value ? { key, color: user?.color, path } : undefined)
  }, [key, provider, user?.color])

  return [
    value,
    setIsFocused
  ]
}
