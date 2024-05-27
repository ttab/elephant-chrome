import { useCollaboration } from './useCollaboration'
import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { isYArray, isYMap, isYValue } from '@/lib/isType'

type PathArray = Array<string | number>
type YParent = Y.Array<unknown> | Y.Map<unknown> | undefined

/**
 * Observe a value in a an exact path. If "deep" is passed, observe all
 * changes beneath the exact path. This hook is especially usefull when observing (any)
 * change to a Y.XmlText structure (i.e Textbit/Slate)
 *
 * @param path string
 * @param deep boolean
 *
 * @returns [<T>, YParent]
 */
export function useYValue<T>(path: string, deep: boolean = false): [
  T | undefined,
  YParent
] {
  const { provider, synced } = useCollaboration()
  const yRoot = synced ? provider?.document.getMap('ele') : undefined
  const pathArray = parseYPath(path)
  const [lastKey] = pathArray.slice(-1)

  // Find out what the initial value is (or undefined if structure is not complete)
  const [initialValue, initialParent] = useMemo((): [T | undefined, YParent] => {
    if (!yRoot) {
      return [undefined, undefined]
    }

    const lastIndex = pathArray.length - 1
    let yValue: unknown = yRoot
    let yParent: YParent

    for (let i = 0; i < pathArray.length; i++) {
      const key = pathArray[i]

      if (isYArray(yValue) && isNumber(key)) {
        if (i === lastIndex) {
          yParent = yValue
        }
        yValue = yValue.get(key)
      } else if (isYMap(yValue) && !isNumber(key)) {
        if (i === lastIndex) {
          yParent = yValue
        }
        yValue = yValue?.get(key)
      }
    }

    return [
      (yValue instanceof Y.XmlText) ? yValue as T : yValue as T,
      yParent
    ]
  }, [yRoot, pathArray])


  // Set initial state value (and it's parent map/array container if structure is complete)
  const [value, setValue] = useState<T | undefined>(initialValue)
  const [container, setContainer] = useState<YParent>(initialParent)


  // Always observe changes from the root to handle initially incomplete data structures
  useEffect(() => {
    // @ts-expect-error Yjs is using any, which is not permitted in our code
    const observer = (yEvents: Array<Y.YEvent<unknown>>): void => {
      yEvents.forEach(yEvent => {
        const yEventPath = !deep ? [...yEvent.path] : yEvent.path.slice(0, pathArray.length)
        const pathMatches = yEventPath.every((value, index) => value === pathArray[index])

        if (pathMatches) {
          let parent

          if (yEvent.target instanceof Y.XmlText) {
            parent = yEvent.target.parent?.parent
            setValue(yEvent.target as T)
          } else {
            parent = (isYValue(yEvent.target)) ? yEvent.target.parent : undefined
            if (isYArray(yEvent.target) && isNumber(lastKey)) {
              setValue(yEvent.target.get(lastKey) as T)
            } else if (isYMap(yEvent.target) && !isNumber(lastKey)) {
              setValue(yEvent.target.get(lastKey) as T)
            }
          }

          // If structure was incomplete and we now have a parent container, set it
          if (!container && (isYArray(parent) || isYMap(parent))) {
            setContainer(parent)
          }
        }
      })
    }

    yRoot?.observeDeep(observer)
    return () => yRoot?.unobserveDeep(observer)
  }, [yRoot, deep, pathArray, container, lastKey])

  // Return value and parent map/array
  return [value, container]
}


function isNumber(value: unknown): value is number {
  return Number.isInteger(value)
}


function parseYPath(input: string): PathArray {
  const result: PathArray = []
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
