import * as Y from 'yjs'
import { isNumber, isRecord, isYArray, isYContainer, isYMap, isYXmlText } from './isType'
import { isTextEntry } from '@/shared/transformations/isTextEntry'
import type { TBElement } from '@ttab/textbit'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

export type YParent = Y.Array<unknown> | Y.Map<unknown> | undefined
export type YPath = Array<string | number>

/**
 * Returns an array with two elements: the value and the parent map or array.
 *
 * @param yRoot Y.Map - Root yMap, can be undefined to make it simpler to call without checking the value first (i.e provider.document.getMap('ele'))
 * @param path string - Path in dot notation from yRoot including the index or property
 */
export function getValueByYPath<T>(yRoot: Y.Map<unknown> | undefined, path: YPath | string, raw: boolean = false): [T | undefined, YParent] {
  if (!yRoot?.doc) {
    return [undefined, undefined]
  }

  const yPath = Array.isArray(path) ? path : stringToYPath(path)
  if (!yPath.length) {
    return [undefined, undefined]
  }

  const lastIndex = path.length - 1
  let parent: YParent = yRoot

  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    let current: unknown

    if (isYArray(parent) && isNumber(key)) {
      current = parent.get(key)
    } else if (isYMap(parent) && !isNumber(key)) {
      current = parent.get(key)
    }

    if (current == null) {
      // Abort if nullish
      break
    }

    if (i === lastIndex) {
      // We're done, we've reached the endpoint of the path
      return [
        (!raw && (isYContainer(current) || isYXmlText(current))) ? current.toJSON() as T : current as T,
        parent
      ]
    }

    parent = current as YParent
  }

  return [undefined, undefined]
}

/**
 * Set a value at the specified path
 *
 * @param yRoot Y.Map - Root yMap, can be undefined to make it simpler to call without checking the value first (i.e provider.document.getMap('ele'))
 * @param path string - Path in dot notation from yRoot including the index or property
 * @param value unknown
 */
export function setValueByYPath(yRoot: Y.Map<unknown> | undefined, path: YPath | string, value: unknown): boolean {
  if (!yRoot?.doc) {
    return false
  }

  const yPath = Array.isArray(path) ? path : stringToYPath(path)
  if (!yPath.length) {
    return false
  }

  const key = yPath.pop()
  const [yStructure] = (yPath.length) ? getValueByYPath(yRoot, yPath, true) : [yRoot]

  if (isYMap(yStructure) && typeof key === 'string') {
    yStructure.set(key, value)
    return true
  } else if (isYArray(yStructure) && typeof key === 'number') {
    if (key == null || key >= yStructure.length) {
      yStructure.push([value])
    } else {
      yStructure.doc?.transact(() => {
        yStructure.delete(key)
        yStructure.insert(key, [value])
      })
    }
    return true
  }

  return false
}

/**
 * Delete an element from either a Y.Map or Y.Array specified by exact path
 *
 * @param yRoot Y.Map - Root yMap, can be undefined to make it simpler to call without checking the value first (i.e provider.document.getMap('ele'))
 * @param path string - Path in dot notation from yRoot including the index or property
 * @returns boolean - true if element was found and removed
 */
export function deleteByYPath(yRoot: Y.Map<unknown> | undefined, path: YPath | string): boolean {
  if (!yRoot?.doc) {
    return false
  }

  const yPath = Array.isArray(path) ? path : stringToYPath(path)
  if (!yPath.length) {
    return false
  }

  const idx = yPath.pop()
  const [yStructure] = (yPath.length) ? getValueByYPath(yRoot, yPath, true) : yRoot

  if (isYMap(yStructure) && typeof idx === 'string' && yStructure.has(idx)) {
    yStructure.delete(idx)
    return true
  } else if (isYArray(yStructure) && typeof idx === 'number' && yStructure.length > idx) {
    yStructure.delete(idx)
    return true
  }

  return false
}

/**
 * Converts a string path to the same array path format used by yjs maintaing
 * the difference between strings for map properties and numbers for array positions.
 *
 * Example:
 * 'meta.myArray[1].value' -> ['meta', 'myArray', 1, 'value]
 */
export function stringToYPath(input: string): YPath {
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

/**
 * Transform any value/structure to a Y representation.
 *
 * @param value unknown
 * @returns unkown
 */
export function toYStructure(value: unknown): unknown {
  if (Array.isArray(value)) {
    const yArray = new Y.Array()
    value.forEach((v: unknown) => yArray.push([toYStructure(v)]))
    return yArray
  }

  if (isRecord(value)) {
    const yMap = new Y.Map()

    for (const key in value) {
      if (isTextEntry(key, value.type as string)) {
        yMap.set(key, toSlateYXmlText(value[key] as string))
      } else {
        yMap.set(key, toYStructure(value[key]))
      }
    }
    return yMap
  }

  return value
}

/**
 * Transform a string to a Y.XmlText structure suitable for Textbit/Slate
 *
 * @param value string
 * @returns Y.XmlText
 */
function toSlateYXmlText(value: string): Y.XmlText {
  const elements = stringToTextbitText(value)

  const yXmlText = new Y.XmlText()
  yXmlText.applyDelta(slateNodesToInsertDelta(elements))

  return yXmlText
}

/**
 * Transform a string separated by newlines to an array of Textbit Slate Elements
 * of type text/core with no further type information (no titles, visuals etc).
 *
 * @param value string
 * @returns TBElement[]
 */
function stringToTextbitText(value: string): TBElement[] {
  const lines = value.trim().split('\n')

  return lines.map(line => {
    return {
      id: crypto.randomUUID(),
      class: 'text',
      type: 'core/text',
      children: [{ text: line }]
    }
  })
}
