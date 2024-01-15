import { useEffect, useState } from 'react'
import type * as Y from 'yjs'

type YMapState = [
  unknown,
  (value: unknown) => void,
  (yMap: Y.Map<unknown>) => void
]

export const useYMap = (key: string, removeEmpty: boolean = false): YMapState => {
  const [map, setMap] = useState<Y.Map<unknown> | undefined>()
  const [value, setValue] = useState<unknown | undefined>()

  useEffect(() => {
    if (!map) {
      return
    }

    map.observe(event => {
      if (!event.keysChanged.has(key)) {
        return
      }

      const ymap = event.target
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          setValue(ymap.get(key))
        } else if (change.action === 'update') {
          setValue(ymap.get(key))
        } else if (change.action === 'delete') {
          setValue(undefined)
        }
      })
    })

    // FIXME: Should unobserve...?
    // return () => {
    //   map.unobserve()
    // }
  }, [map, key])

  return [
    value,
    (value: unknown) => {
      if (!map || !key) {
        return
      }

      setValue(value)

      if (removeEmpty && typeof value === 'undefined') {
        map.delete(key)
      } else {
        map.set(key, value)
      }
    },
    (yMap: Y.Map<unknown>): void => {
      setMap(yMap)
      setValue(yMap.get(key))
    }
  ]
}
