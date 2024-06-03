import { useCollaboration } from './useCollaboration'
import { useCallback, useEffect, useState } from 'react'
import { isYArray, isYContainer, isYMap, isYValue, isYXmlText } from '@/lib/isType'
import type * as Y from 'yjs'

type YPath = Array<string | number>
type YParent = Y.Array<unknown> | Y.Map<unknown> | undefined

/**
 * Observe a value in a an exact path. If the observed value is a Y.XmlText all changes beneath
 * that value are observed, but the value returned is returned as string. If you need to access
 * the actual Y.XmlText structure you can use the parent container which is also returned.
 *
 * This function also detects, recovers and continue to observe when a whole structure gets replaced.
 *
 * @param path string
 *
 * @returns [<T>, (arg0: T) => void, YParent]
 */
export function useYValue<T>(path: string): [
  T | undefined,
  (arg0: T) => void,
  YParent
] {
  const { provider } = useCollaboration()
  const yRoot = provider?.document.getMap('ele')
  const yPath = stringToYPath(path)
  const [value, setValue] = useState<T | undefined>()
  const [parent, setParent] = useState<YParent>()


  // Initialization callback function
  const initialize = useCallback((yRoot: Y.Map<unknown>): void => {
    const [v, p] = getValueByYPath(yRoot, yPath)
    setValue(isYXmlText(v) ? v.toJSON() as T : v as T)

    if (isYContainer(p)) {
      setParent(p)
    }
  }, [yPath])


  // Initialization
  useEffect(() => {
    if (yRoot && value === undefined) {
      initialize(yRoot)
    }
  }, [yRoot, initialize, value])


  // Setup the observer
  useEffect(() => {
    if (!yRoot) {
      return
    }

    // @ts-expect-error Yjs is using any, which is not permitted in our code
    const observer = (yEvents: Array<Y.YEvent<unknown>>): void => {
      yEvents.forEach(yEvent => {
        const yEventPath = yEvent.path.slice(0, yPath.length)
        const pathMatch = yEventPath.length && yEventPath.every((v, idx) => v === yPath[idx])
        const exactMatch = yEvent.path.length === yPath.length && yEvent.path.every((v, idx) => v === yPath[idx])

        if (exactMatch) {
          setValue(yEvent?.target !== undefined ? yEvent.target as T : undefined)

          if (!parent && isYValue(yEvent.target) && isYContainer(yEvent.target.parent)) {
            setParent(yEvent.target.parent)
          }
        } else if (pathMatch) {
          // We observe deeper for Y.XmlText or when we observe individual values in a Y.Map or Y.Array
          const [v, p] = getValueByYPath(yRoot, yPath)

          if (isYXmlText(v)) {
            // Report the change (as string) to the Y.Xmltext value.
            // CAVEAT: Should not observe large docs like this as this would then not be very perfomant!
            setValue(v.toJSON() as T)
          } else if (yEventPath.length + 1 === yPath.length) {
            // The change event refers to a property in a direct parent map/array,
            // ensure it is the observed property that is changed
            const [key] = yPath.slice(-1)
            if (yEvent.keys.has(key.toString())) {
              setValue(v as T)
            }
          } else if (yEventPath.length < yPath.length && !!p && p !== parent) {
            // The parent structure have changed but the exact path still exists.
            // This happens if a larger structure gets replaced.
            setValue(v as T)
          } else if (!p) {
            // The parent is gone, which means the whole structure is gone
            setValue(undefined)
          }

          // If we have no parent from before, or the parent has changed, we need to set it again
          if (p !== parent) {
            setParent(p)
          }
        }
      })
    }

    // Always observe changes from the root to handle initially incomplete data structures
    // TODO: We could optimze this by observing as far down in the structure as we could
    yRoot?.observeDeep(observer)

    return () => yRoot?.unobserveDeep(observer)
  }, [yRoot, yPath, parent])

  // Return value and parent map/array
  return [
    value,
    (v) => {
      const [key] = yPath.slice(-1)

      if (isYMap(parent) && !isNumber(key)) {
        parent.set(key, v)
      } else if (isYArray(parent) && isNumber(key) && key > 0 && key <= parent.length - 1) {
        parent.doc?.transact(() => {
          parent.delete(key)
          parent.insert(key, [v])
        })
      }
    },
    parent
  ]
}


function isNumber(value: unknown): value is number {
  return Number.isInteger(value)
}


/**
 * Traverse a yjs structure to find the wanted value based on the yjs path.
 *
 * Returns an array with two elements. First the value and then the parent map or array.
 */
function getValueByYPath<T>(root: Y.Map<unknown>, path: YPath): [T | undefined, YParent] {
  const lastIndex = path.length - 1
  let parent: unknown = root

  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    let current: unknown

    if (isYArray(parent) && isNumber(key)) {
      current = parent.get(key)
    } else if (isYMap(parent) && !isNumber(key)) {
      current = parent?.get(key)
    }

    if (i === lastIndex) {
      return [current as T, parent as YParent]
    }

    parent = current
  }

  return [undefined, undefined]
}


/**
 * Converts a string path to the same array path format used by yjs maintaing
 * the difference between strings for map properties and numbers for array positions.
 *
 * Example:
 * 'meta.myArray[1].value' -> ['meta', 'myArray', 1, 'value]
 */
function stringToYPath(input: string): YPath {
  const result: YPath = []
  const regex = /([^[\].]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    if (match[1]) {
      // Matched a word (property in a Y.Map)
      result.push(match[1])
    } else if (match[2]) {
      // Matched a number in brackets (array index)
      result.push(parseInt(match[2]))
    }
  }

  return result
}
