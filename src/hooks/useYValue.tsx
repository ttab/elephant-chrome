import { useCollaboration } from './useCollaboration'
import { useCallback, useEffect, useState } from 'react'
import { isNumber, isYArray, isYContainer, isYMap, isYValue, isYXmlText } from '@/lib/isType'
import type * as Y from 'yjs'
import { createYStructure, getValueByYPath, stringToYPath, type YParent } from '@/lib/yUtils'

interface useYValueOptions {
  observe?: boolean
  createOnEmpty?: {
    path: string
    data: unknown
  }
}

/**
 * Observe a value in a an exact path. If the observed value is a Y.XmlText all changes beneath
 * that value are observed, but the value returned is returned as string.
 *
 * This function also detects, recovers and continue to observe when a whole structure gets replaced.
 *
 * Specifying option observe=false will return raw value and not setup an observer. This is
 * especially useful when you want to retrieve a raw Y.XmlText to hand over to Textbit.
 *
 * Specifying option createOnEmpty creates the structure if no value was found. Path must always
 * end with a property name in a Y.Map or a Y.Array in which case the new
 * structure is pushed to the array.
 *
 * @param path string
 *
 * @returns [<T>, (arg0: T) => void, YParent]
 */
export function useYValue<T>(path: string, options: useYValueOptions = { observe: true }): [
  T | undefined,
  (arg0: T) => void,
  YParent
] {
  const { provider, synced } = useCollaboration()
  const yRoot = provider?.document.getMap('ele')
  const yPath = stringToYPath(path)
  const [value, setValue] = useState<T | undefined>()
  const [parent, setParent] = useState<YParent>()

  // Get y value/parent callback function
  const getValueAndParent = useCallback((yRoot: Y.Map<unknown>): [unknown, YParent] => {
    const vp = getValueByYPath(yRoot, yPath)

    if (synced && vp[0] === undefined && options.createOnEmpty) {
      // No value exists and caller wants us to fill in empty structure
      const { path, data } = options.createOnEmpty
      if (createYStructure(yRoot, path, data)) {
        return getValueByYPath(yRoot, yPath)
      }
    }

    return vp
  }, [synced, yPath, options?.createOnEmpty])


  // Initialization callback function
  const initialize = useCallback((yRoot: Y.Map<unknown>): void => {
    const [initValue, initParent] = getValueAndParent(yRoot)

    if (options.observe) {
      // When observing we return Y.XmlText as string
      setValue(isYXmlText(initValue) ? initValue.toJSON() as T : initValue as T)
    } else {
      // Just return raw Y values when not observing
      setValue(initValue as T)
    }

    if (isYContainer(initParent)) {
      setParent(initParent)
    }
  }, [getValueAndParent, options.observe])


  const ensureValue = useCallback((value: unknown): T => {
    if (isYContainer(value)) {
      return value.toJSON() as T
    }
    return value as T
  }, [])


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

    if (!options.observe) {
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
            return
          }

          if (yEventPath.length + 1 === yPath.length) {
            // The change event refers to a property in a direct parent map/array,
            // ensure it is the observed property that is changed
            const [key] = yPath.slice(-1)
            if (yEvent.keys.has(key.toString())) {
              setValue(v as T)
              return
            }
          }

          if (yEventPath.length < yPath.length && !!p) {
            // The parent structure have changed but the exact path still exists.
            // This happens if a larger structure gets replaced.
            setValue(ensureValue(v))
            return
          }

          if (!p) {
            // The parent is gone, which means the whole structure is gone
            setValue(undefined)
            return
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
  }, [yRoot, yPath, parent, options.observe, ensureValue])

  // Return value and parent map/array
  return [
    ensureValue(value),
    (v) => {
      const [key] = yPath.slice(-1)

      // Set value in parent YMap
      if (isYMap(parent) && !isNumber(key)) {
        parent.set(key, v)
        return
      }

      // Delete a value from parent YArray
      if (isYArray(parent) && isNumber(key) && key >= 0 && key <= parent.length - 1 && v === undefined) {
        parent.delete(key)

        // Delete "grandparent" if parent YArray is empty
        // TODO: This could be recursive to delete all empty parents
        const [nextKey] = yPath.slice(-2)
        if (parent.length === 0 && isYMap(parent.parent) && typeof nextKey === 'string') {
          parent.parent.delete(nextKey)
        }
        return
      }

      // Replace value in parent YArray
      if (isYArray(parent) && isNumber(key) && key >= 0 && key <= parent.length - 1) {
        parent.doc?.transact(() => {
          parent.delete(key)
          parent.insert(key, [v])
        })
        return
      }

      // Append value to parent YArray
      if (isYArray(parent) && isNumber(key) && key >= 0 && key > parent.length - 1) {
        parent.push([v])
      }
    },
    parent
  ]
}

