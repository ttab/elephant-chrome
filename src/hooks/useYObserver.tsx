import * as yMapValueByPath from '@/lib/yMapValueByPath'
import { useCollaboration } from '.'
import { useCallback, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { toYMap } from '../../src-srv/utils/transformations/lib/toYMap'
import { type Block } from '@/protos/service'

export const useForceUpdate = (): () => void => {
  const [, dispatch] = useState(Object.create(null))

  return useCallback(
    () => dispatch(Object.create(null)),
    [dispatch]
  )
}

interface YObserved {
  get: (key: string) => unknown | undefined
  set: (value: string | Partial<Block> | undefined, key?: string) => void
  state: Block | Block[]
  loading: boolean
}

export function useYObserver(path: string): YObserved {
  const [loading, setLoading] = useState(true)
  const forceUpdate = useForceUpdate()

  // Get Y.Doc from provider and extract planning Y.Map
  const { provider, synced: isSynced } = useCollaboration()
  const document = isSynced ? provider?.document : undefined
  const yPlanning = document?.getMap('planning')

  // Get wanted Y.Map by path provided
  const map = yMapValueByPath.get(yPlanning, path)

  // Observe whole yPlanning to detect changes at top
  useEffect(() => {
    // Do we have a yPlanning to work with?
    if (yPlanning) {
      setLoading(false)
    }

    yPlanning?.observeDeep((events) => {
      // Do actions on change
      events.forEach(ev => {
        // TODO: is this good enough?
        if (path.includes(ev.path.join('.'))) {
          forceUpdate()
        }
      })
    })
    // TODO: How do we unobserve
    // return yPlanning?.unobserveDeep(() => console.log('Unobserving yPlanning'))
  }, [yPlanning, forceUpdate, path])

  // Observe specific Y.Map for changes in values
  useEffect(() => {
    map?.observe(() => forceUpdate())
  }, [map, forceUpdate])


  return {
    get: (key: string) => map?.get(key),
    set: (value: string | Partial<Block> | undefined, key?: string) => handleSetYmap({
      map,
      path,
      key,
      value,
      yPlanning
    }),
    state: map?.toJSON() as Block | Block[],
    loading
  }
}

function handleSetYmap({ map, path, key, value, yPlanning }:
{ map?: Y.Map<unknown>, path: string, key?: string, value: string | Partial<Block> | undefined, yPlanning?: Y.Map<unknown> }): void {
  // When no map or map.parent we need to set the value on the yPlanning document
  if (!map?.parent) {
    if (typeof value !== 'object') {
      throw new Error('Value can not be of type string when no Y.Map exists')
    }

    if (!yPlanning) {
      throw new Error('No original Y.Map provided, can not set valye without Y.Map')
    }
    yMapValueByPath.set(yPlanning, path, toYMap(value))
  }
  // If key is provided, set value on key
  if (key && map) {
    map.set(key, value)
  } else {
    // When no key and parent is Array, update with new Y.Map
    if (map?.parent instanceof Y.Array) {
      // TODO: Could we get maps index in parent from Y.Map or Y.Array?
      const index = path.match(/\[(\d+)\]/)
      if (!index) {
        throw new Error('Not able to find an index')
      }

      if (typeof value === 'string') {
        throw new Error('value can not be of type string when no Y.Map exists')
      }

      map.parent.delete(Number(index[1]))
      map.parent.insert(Number(index[1]), [toYMap(value as Record<string, unknown>)])
    }
  }
}
