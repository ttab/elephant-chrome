import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { toYMap } from '../../src-srv/utils/transformations/yjs/yPlanning'

import { get, set } from '../lib/yMapValueByPath'

type YSetter = (value: unknown) => void
type YObservableState = [Y.Map<string> | Y.Array<unknown> | string, YSetter]

export function useYObserver(y: Y.Map<unknown> | undefined, key: string): [string, YSetter]
export function useYObserver(y: Y.Array<unknown> | undefined, key?: string): [Y.Array<unknown>, YSetter]
export function useYObserver(y: Y.Map<unknown> | Y.Array<unknown> | undefined, key?: string): YObservableState {
  const [value, setValue] = useState<unknown | undefined>(get(y as Y.Map<unknown>, key)
  )

  useEffect(() => {
    if (!y) {
      return
    }

    y.observeDeep(events => {
      for (const event of events) {
        event.changes.keys.forEach((change) => {
          if (change.action === 'update') {
            setValue(get(y as Y.Map<unknown>, key))
          } else {
            throw new Error(`unknown action: ${change.action}`)
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
    value as string,
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
