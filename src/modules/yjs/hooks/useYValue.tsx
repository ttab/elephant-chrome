import { isEqualDeep } from '../lib/isEqualDeep'
import { doesArrayChangeAffectPath, extractYData, getValueFromPath, setValueByPath, stringToYPath, yPathToString, type YPath } from '../lib/yjs'
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
   *  Callback to get snapshot of current value
   */
  const getSnapshot = useCallback((): T | undefined => {
    if (!yContainer || !valid.current) return undefined

    const val = getValueFromPath<T>(yContainer, observedPath)
    return (!raw && (val instanceof Y.Map || val instanceof Y.Array || val instanceof Y.XmlText))
      ? extractYData(val)
      : val
  }, [yContainer, observedPath, raw])

  /**
   * Ref to current snapshot value
   */
  const snapshotRef = useRef<T | undefined>(getSnapshot())

  /**
   * Callback to get a stable snapshot to ensure stable references when value is not changed
   */
  const getStableSnapshot = useCallback((): T | undefined => {
    const nextValue = getSnapshot()
    if (!isEqualDeep(nextValue, snapshotRef.current)) {
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
        const changedPath = (event.target instanceof Y.XmlText)
          ? event.path.slice(0, -1)
          : [...event.path, ...Array.from(event.keys.keys())]
        const changedKey = yPathToString([...changedPath])

        if (changedKey === observedKey) {
          // Exact observed path have changed
          const newValue = getValueFromPath<T>(yContainer, observedPath)

          if (event.target instanceof Y.XmlText) {
            // Y.XmlText values only report change if the string value is observed
            if (!raw && newValue?.toString() !== snapshotRef.current) {
              onStoreChange()
            }
          } else if (event.target instanceof Y.Array || event.target instanceof Y.Map) {
            // Y.Array or Y.Map changed
            onStoreChange()
            return
          } else if (!isEqualDeep(newValue, snapshotRef.current)) {
            // All other directly observed path changes should report a change
            onStoreChange()
          }

          return
        } else if (event.target instanceof Y.Array) {
          if (doesArrayChangeAffectPath(event as Y.YEvent<Y.Array<unknown>>, observedPath)) {
            // An array change affects the observed path
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
