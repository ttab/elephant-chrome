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

export interface YObserved {
  get: (key: string) => unknown
  set: (value: string | Partial<Block> | undefined, key?: string) => void
  state: Block | Block[]
  loading: boolean
}

export function useYObserver(name: string, path: string): YObserved {
  const forceUpdate = useForceUpdate()

  // Get Y.Doc from provider and extract Root Y.Map by it's name
  const { provider, synced: isSynced } = useCollaboration()
  const document = isSynced ? provider?.document : undefined
  const yRoot = document?.getMap(name)

  // Get wanted Y.Map by path provided
  const map = yMapValueByPath.get(yRoot, path)

  // Observe root Y.Map to detect changes at top
  useEffect(() => {
    yRoot?.observeDeep((events) => {
      // Do actions on change
      events.forEach(ev => {
        // Convert provided path to a comparable array
        const pathAsArray = path
          .split(/\.|\[|\]/g)
          .filter(x => x !== '')

        // Check if observed change is on same path as provided path
        // This will also register changes on same path before observed value
        // Change on ['meta', 'core/description'] will trigger even if meta.core/description[0].data is the observed value
        const changeIsOnSamePath = ev.path.every((value, index) => value.toString() === pathAsArray[index])

        // Do update
        if (changeIsOnSamePath) {
          forceUpdate()
        }
      })
    })

    // TODO: How do we unobserve
    // return yPlanning?.unobserveDeep(() => console.log('Unobserving root Y.Map'))
  }, [yRoot, forceUpdate, path])

  return {
    get: useCallback((key: string) => map?.get(key), [map]),
    set: useCallback((value: string | Partial<Block> | undefined, key?: string) => handleSetYmap({
      map,
      path,
      key,
      value,
      yRoot
    }), [map, path, yRoot]),
    state: map?.toJSON() as Block | Block[],
    loading: !isSynced
  }
}

function handleSetYmap({ map, path, key, value, yRoot }: {
  map?: Y.Map<unknown>
  path: string
  key?: string
  value: string | Partial<Block> | undefined
  yRoot?: Y.Map<unknown>
}): void {
  // When no map or map.parent we need to set the value on the root Y.Map
  if (!map?.parent) {
    if (typeof value !== 'object') {
      throw new Error('Value can not be of type string when no Y.Map exists')
    }

    if (!yRoot) {
      throw new Error('No root Y.Map provided, can not set value without Y.Map')
    }
  }

  // If key is provided, set value on key
  // Handles simple values
  if (key && map) {
    map.set(key, value)
  } else {
    // When no key and parent is Array, update with new Y.Map
    // Handles objects
    if (map?.parent instanceof Y.Array) {
      // TODO: Could we get maps index in parent from Y.Map or Y.Array?
      const index = path.match(/\[(\d+)\]/)

      // Throw when no index is provided
      if (!index) {
        throw new Error('Not able to find an index')
      }

      if (typeof value === 'string') {
        throw new Error('value can not be of type string when no Y.Map exists')
      }

      map.doc?.transact(() => {
        if (map.parent instanceof Y.Array) {
          map.parent.delete(Number(index[1]))
          map.parent.insert(Number(index[1]), [toYMap(value as Record<string, unknown>)])
        }
      })
    } else {
      if (yRoot) {
        yMapValueByPath.set(yRoot, path, toYMap(value as Record<string, unknown>))
      }
    }
  }
}
