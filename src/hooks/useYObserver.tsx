import { useCallback, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { toYMap } from '../../src-srv/utils/transformations/lib/toYMap'

import { get, set } from '../lib/yMapValueByPath'

type YSetter = (value: unknown) => void


/*
 * Create an observer for YJS Shared Type
 * Should always return a "workable" format, array, object or string
 */
export function useYObserver<T>(y: { value: Y.Map<unknown> | undefined, base: Y.Map<unknown> | Y.Array<unknown>, path: string }, key: string): [T, YSetter]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useYObserver<T extends Record<string, any>>(y: { value: Y.Map<unknown> | undefined, base: any, path: string }, key?: string): [Record<string, T>, YSetter]
export function useYObserver<T>(y: { value: Y.Array<unknown> | undefined, base: Y.Map<unknown> | Y.Array<unknown>, path: string }, key?: string): [T[], YSetter]
export function useYObserver<T>(y: { value: Y.Map<unknown> | Y.Array<unknown> | undefined, base: Y.Map<unknown> | Y.Array<unknown>, path: string }, key?: string): [T | Record<string, T> | T[], YSetter] {
  const initialValue = useCallback(() => get(y?.value, key).value, [y?.value, key])

  const [value, setValue] = useState<unknown | undefined>(initialValue)
  useEffect(() => {
    if (!y?.value) {
      return
    }

    /* Reset value because y.value or key has changed
     * Catch changes above in structure
     */
    setValue(() => {
      const value = get(y.value, key).value

      if (typeof value === 'string' || value === undefined) return value
      if (!key) {
        return value
      }

      return value.toJSON()
    })

    y.value.observeDeep(events => {
      for (const ev of events) {
        if (ev.keysChanged?.has(key)) {
          ev.changes.keys.forEach((change) => {
            switch (change.action) {
              case 'add':
                setValue(get(y?.value, key).value)
                break

              case 'update':
                setValue(get(y?.value, key).value)
                break

              case 'delete':
                setValue(get(y?.value, key).value)
                break

              default:
                throw new Error(`unknown action: ${change.action as string}`)
            }
          })
        } else {
          setValue(get(ev.target, key).value?.toJSON())
        }
      }
    })

    // FIXME: Should unobserve...?
    // return () => {
    //   y.unobserve()
    // }
  }, [y?.value, key])

  return [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value as any,
    (change) => {
      if (y.value instanceof Y.Array) {
        set(y.value, key, toYMap(change))
        setValue(change)
        return
      }

      if (y.value instanceof Y.Map && key) {
        if (typeof change === 'string') {
          set(y.value, key, change)
          setValue(change)
          return
        } else {
          throw new Error(`Invalid change type:${typeof change}`)
        }
      }
      if (y.value === undefined) {
        set(y.base, y.path + key, toYMap(change))
        setValue(get(y.base, y.path + key).value.toJSON())
      }
    }
  ]
}
