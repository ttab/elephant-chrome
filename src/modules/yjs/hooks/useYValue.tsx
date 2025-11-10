import { isEqualDeep } from '../lib/isEqualDeep'
import { doesArrayChangeAffectPath, getValueFromPath, setValueByPath, stringToYPath, yPathToString, type YPath } from '@/shared/yUtils'
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import * as Y from 'yjs'

export function useYValue<T>(
  yContainer: Y.Map<unknown> | Y.Array<unknown> | undefined,
  relativePath: YPath | string,
  raw: boolean = false
): [T | undefined, (newValue: T) => void] {
  const valid = useRef<boolean>(true)
  const [observedKey, observedPath] = useMemo(() => {
    return (typeof relativePath === 'string')
      ? [relativePath, stringToYPath(relativePath)]
      : [yPathToString(relativePath), relativePath]
  }, [relativePath])

  /**
   * Ref to current snapshot value
   */
  const snapshotRef = useRef<T | undefined>(getValueFromPath<T>(yContainer, observedPath, raw))

  /**
   *  Callback to get snapshot of current value
   */
  const getSnapshot = useCallback((): T | undefined => {
    if (!yContainer || !valid.current) return undefined

    const nextValue = getValueFromPath<T>(yContainer, observedPath, raw)
    if (!isEqualDeep(nextValue, snapshotRef.current)) {
      snapshotRef.current = nextValue
    }
    return snapshotRef.current
  }, [yContainer, observedPath, raw])

  /**
   * Callback to get a stable snapshot to ensure stable references when value is not changed
   */
  const getStableSnapshot = useCallback((): T | undefined => {
    const nextValue = getSnapshot()

    if (nextValue instanceof Y.Array && nextValue.length !== (snapshotRef.current as Y.Array<unknown>)?.length) {
      snapshotRef.current = nextValue
    } else if (!isEqualDeep(nextValue, snapshotRef.current)) {
      snapshotRef.current = nextValue
    }

    return snapshotRef.current
  }, [getSnapshot])

  /**
   * Callback for subscribing to changes
   */
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (!yContainer) return () => { }

    // Yjs observeDeep() event handler
    const onEvent = (events: Y.YEvent<Y.Map<T> | Y.Array<T>>[]) => {
      for (const event of events) {
        const handleChangeForPath = (path: (string | number)[]) => {
          const candidateKey = yPathToString(path)
          if (candidateKey !== observedKey) {
            return false
          }

          const newValue = getValueFromPath<T>(yContainer, observedPath, raw)

          if (event.target instanceof Y.XmlText) {
            if (!raw && newValue?.toString() !== snapshotRef.current) {
              onStoreChange()
            }
            return true
          }

          if (event.target instanceof Y.Array || event.target instanceof Y.Map) {
            onStoreChange()
            return true
          }

          if (!isEqualDeep(newValue, snapshotRef.current)) {
            onStoreChange()
          }
          return true
        }

        if (handleChangeForPath(event.path)) {
          return
        }

        let changedPath: (string | number)[]
        if (event.target instanceof Y.XmlText) {
          // Y.XmlText refers to a position in it's last path segment
          changedPath = event.path.slice(0, -1)
        } else if (event.target instanceof Y.Array) {
          // For arrays, the path is just event.path (changes are in delta, not keys)
          changedPath = event.path
        } else {
          // For maps include the changed keys
          changedPath = [...event.path, ...Array.from(event.keys.keys())]
        }

        if (handleChangeForPath(changedPath)) {
          // If we handled the change via the expanded path we stop looking
          return
        } else if (event.target instanceof Y.Array) {
          // Check for indirect influences when array contents change
          if (doesArrayChangeAffectPath(event as Y.YEvent<Y.Array<unknown>>, observedPath)) {
            onStoreChange()
            return
          }
        }
      }
    }

    yContainer.observeDeep(onEvent)
    return () => yContainer.unobserveDeep(onEvent)
  }, [yContainer, observedKey, observedPath, raw])

  // Set value callback function
  const set = useCallback((newValue: T) => {
    if (yContainer) {
      setValueByPath(yContainer, observedPath, newValue)
    }
  }, [yContainer, observedPath])

  return [
    useSyncExternalStore(subscribe, getStableSnapshot),
    set
  ]
}
