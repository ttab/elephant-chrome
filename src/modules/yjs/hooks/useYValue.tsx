import { isEqualDeep } from '../lib/isEqualDeep'
import { extractYData, getValueFromPath, setValueByPath, stringToYPath, type YPath } from '../lib/yjs'
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import * as Y from 'yjs'

export function useYValue<T>(
  y: Y.Doc | Y.Map<unknown> | undefined,
  fullPath: YPath | string,
  raw: boolean = false
): [T | undefined, (newValue: T) => void] {
  const normalizedPath = useMemo(() =>
    typeof fullPath === 'string' ? stringToYPath(fullPath) : fullPath,
  [fullPath]
  )

  // Get snapshot of current value
  const getSnapshot = useCallback((): T | undefined => {
    const { ymap, path } = getRoot(y, normalizedPath) || {}
    if (!ymap || !path) return undefined

    const val = getValueFromPath<T>(ymap, path)
    return (!raw && (val instanceof Y.Map || val instanceof Y.Array || val instanceof Y.XmlText))
      ? extractYData(val)
      : val
  }, [y, normalizedPath, raw])

  // Track snapshoted values
  const snapshotRef = useRef<T | undefined>(getSnapshot())

  // Get stable snapshot which ensures stable references when value is not changed
  const getStableSnapshot = useCallback((): T | undefined => {
    const nextValue = getSnapshot()
    if (!isEqualDeep(nextValue, snapshotRef.current)) {
      snapshotRef.current = nextValue
    }

    return snapshotRef.current
  }, [getSnapshot])

  // Subscribe to changes
  const subscribe = useCallback((onStoreChange: () => void) => {
    const { ymap, path } = getRoot(y, normalizedPath) || {}
    if (!ymap || !path) return () => { }

    const targetPath = path.join('.')
    let lastValue = getValueFromPath<T>(ymap, path)

    // Yjs observeDeep() event handler
    const onEvent = (events: Y.YEvent<Y.Map<T>>[]) => {
      for (const event of events) {
        const changedPath = [...event.path, ...Array.from(event.keys.keys())].join('.')

        if (changedPath === targetPath) {
          // Y.Map key have changed
          const newValue = getValueFromPath<T>(ymap, path)

          if (!isEqualDeep(newValue, lastValue)) {
            lastValue = newValue
            onStoreChange()
          }
          return
        }

        if (event.target instanceof Y.Array && typeof path.at(-1) === 'number') {
          // Y.Array have changed
          const idx = path.at(-1) as number

          let index = 0
          for (const op of event.changes.delta) {
            if (op.retain) {
              index += op.retain
            } else if (op.insert) {
              const start = index
              const end = index + op.insert.length

              if (idx >= start && idx < end) {
                // This is wrong
                const newValue = getValueFromPath<T>(ymap, path)
                if (!isEqualDeep(newValue, lastValue)) {
                  lastValue = newValue
                  onStoreChange()
                }
                break
              }
              index = end
            } else if (op.delete) {
              const start = index
              const end = index + op.delete
              if (idx >= start && idx < end) {
                // This is wrong
                const newValue = getValueFromPath<T>(ymap, path)
                if (!isEqualDeep(newValue, lastValue)) {
                  lastValue = newValue
                  onStoreChange()
                }
                break
              }
              // index stays the same
            }
          }
        }
      }
    }

    ymap.observeDeep(onEvent)
    return () => ymap.unobserveDeep(onEvent)
  }, [y, normalizedPath])

  // Set value callback function
  const set = useCallback((newValue: T) => {
    const { ymap, path } = getRoot(y, normalizedPath) || {}
    if (ymap && path) {
      setValueByPath(ymap, path, newValue)
    }
  }, [y, normalizedPath])

  return [
    useSyncExternalStore(subscribe, getStableSnapshot),
    set
  ]
}

function getRoot(y: Y.Doc | Y.Map<unknown> | undefined, relativePath: YPath): undefined | {
  ydoc: Y.Doc
  ymap: Y.Map<unknown> | Y.Array<unknown>
  path: YPath
} {
  if (!y) {
    return
  }

  if (y instanceof Y.Map) {
    if (!y.doc) {
      return
    }

    return {
      ydoc: y.doc,
      ymap: y,
      path: relativePath
    }
  }

  const path = [...relativePath] as YPath
  const rootKey = path.shift()
  if (typeof rootKey !== 'string') {
    return
  }

  const ymap = y.getMap(rootKey)
  if (!ymap) {
    return
  }

  return {
    ydoc: y,
    ymap,
    path
  }
}
