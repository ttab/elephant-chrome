import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { toYMap } from '../../src-srv/utils/transformations/yjs/yPlanning'

import { get, set } from '../lib/yMapValueByPath'

type YSetter = (value: unknown) => void


/*
 * Create an observer for YJS Shared Type
 * Should always return a "workable" format, array, object or string
 */
export function useYObserver<T>(y: Y.Map<unknown> | undefined, key: string): [T, YSetter]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useYObserver<T extends Record<string, any>>(y: Y.Map<unknown> | undefined, key?: string): [Record<string, T>, YSetter]
export function useYObserver<T>(y: Y.Array<unknown> | undefined, key?: string): [T[], YSetter]
export function useYObserver<T>(y: Y.Map<unknown> | Y.Array<unknown> | undefined, key?: string): [T | Record<string, T> | T[], YSetter] {
  const [value, setValue] = useState<unknown | undefined>(get(y as Y.Map<unknown>, key))

  useEffect(() => {
    if (!y) {
      return
    }
    y.observeDeep(events => {
      for (const ev of events) {
        ev.changes.keys.forEach((change) => {
          switch (change.action) {
            case 'add':
              setValue(y.toJSON())
              break

            case 'update':
              setValue(y.toJSON())
              break

            case 'delete':
              setValue(y.toJSON())
              break

            default:
              throw new Error(`unknown action: ${change.action as string}`)
          }
        })
      }
    })

    // FIXME: Should unobserve...?
    // return () => {
    //   y.unobserve()
    // }
  }, [y, key])

  return [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value as any,
    (change) => {
      if (y instanceof Y.Array) {
        y.push([toYMap(change as Record<string, unknown>, new Y.Map())])
        setValue([...value as unknown[], change])
      }

      if (y instanceof Y.Map && key) {
        if (typeof change === 'string') {
          set(y, key, change)
          setValue(change)
        } else {
          throw new Error(`Invalid change type:${typeof change}`)
        }
      }
    }
  ]
}
