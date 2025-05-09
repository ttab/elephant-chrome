import { isEqualDeep } from '@/lib/isEqualDeep'
import { useRef, useSyncExternalStore } from 'react'
import { getValueByYPath, setValueByYPath, stringToYPath } from '@/lib/yUtils'
import { useCollaboration } from './useCollaboration'
import type { HocuspocusProvider } from '@hocuspocus/provider'

/**
 * Observe a value in a an exact path. If the observed value is a Y.XmlText all changes beneath
 * that value are observed, but the value returned is returned as string.
 *
 * This function also detects, recovers and continue to observe when a whole structure gets replaced.
 *
 * Specifying option raw=true will return raw value and not setup an observer. This is
 * especially useful when you want to retrieve a raw Y.XmlText to hand over to Textbit or
 * if you want to have a structure that you want to manipulate, like adding elements to a Y.Map/Y.Array.
 *
 * @param path string
 *
 * @returns [<T>, (arg0: T) => void, YParent]
 */
export function useYValue<T>(path: string, raw: boolean = false, externalProvider?: HocuspocusProvider, rootMap?: string): [
  T | undefined,
  (arg0: T) => void
] {
  const { provider: defaultProvider } = useCollaboration()
  const provider = externalProvider || defaultProvider
  const prevDataRef = useRef<T | undefined>(undefined)
  const yRoot = provider?.document.getMap(rootMap ?? 'ele')
  const yPath = stringToYPath(path)

  const data = useSyncExternalStore(
    (callback) => {
      if (!yRoot) {
        return () => { }
      }

      // Observe deep changes in the Yjs document and trigger updates
      yRoot.observeDeep(callback)
      return () => yRoot.unobserveDeep(callback)
    },
    () => {
      // Get the current value at the path
      const [currentData] = getValueByYPath(yRoot, yPath, raw)

      if (isEqualDeep(prevDataRef.current, currentData)) {
        return prevDataRef.current
      } else {
        prevDataRef.current = currentData as T
        return currentData
      }
    },
    () => getValueByYPath(yRoot, yPath, raw) // Fallback for server-side rendering
  )

  // Setter function to update the value at the path
  const setData = (newValue: T): void => {
    setValueByYPath(yRoot, yPath, newValue)
  }

  return [
    data as T,
    setData
  ]
}
