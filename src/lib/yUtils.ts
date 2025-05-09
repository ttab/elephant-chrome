import * as Y from 'yjs'
import { isNumber, isRecord, isYArray, isYContainer, isYMap, isYXmlText } from './isType'
import { isTextEntry } from '@/shared/transformations/isTextEntry'
import type { TBElement } from '@ttab/textbit'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

type YParent = Y.Array<unknown> | Y.Map<unknown> | undefined
type YPath = Array<string | number>

/**
 * Returns an array with two elements: the value and the parent map or array.
 *
 * @param yRoot Y.Map - Root yMap, can be undefined to make it simpler to call without checking the value first (i.e provider.document.getMap('ele'))
 * @param path string - Path in dot notation from yRoot including the index or property
 * @param raw boolean | undefined - Optionally return raw yjs value, default is false
 */
export function getValueByYPath<T>(yRoot: Y.Map<unknown> | undefined, path: YPath | string, raw: boolean = false): [T | undefined, YParent] {
  if (!yRoot?.doc) {
    return [undefined, undefined]
  }

  const yPath = Array.isArray(path) ? path : stringToYPath(path)
  if (!yPath.length) {
    return [yRoot.toJSON() as T, yRoot]
  }

  const lastIndex = yPath.length - 1
  let parent: YParent = yRoot

  for (let i = 0; i < yPath.length; i++) {
    const key = yPath[i]
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
      // We're done, we've reached the endpoint of the yPath
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

  const parent = getParent(yRoot, yPath)
  if (!parent) {
    return false
  }

  const lastKey = yPath[yPath.length - 1]
  if (isYMap(parent) && typeof lastKey === 'string') {
    parent.set(lastKey, toYStructure(value))
    return true
  }

  if (isYArray(parent) && isNumber(lastKey)) {
    setArrayValue(parent, lastKey, value)
    return true
  }

  return false
}

function getParent(yRoot: Y.Map<unknown> | Y.Array<unknown>, yPath: YPath): Y.Map<unknown> | Y.Array<unknown> | undefined {
  let current = yRoot

  for (let i = 0; i < yPath.length - 1; i++) {
    const currentKey = yPath[i]
    const isArrayIndex = isNumber(currentKey)
    const isNextArrayIndex = isNumber(yPath[i + 1])

    if (isArrayIndex) {
      if (isYMap(current)) {
        throw new Error(`Invalid path. Expected an array, but encountered a map at '${currentKey}'.`)
      }

      current = current.get(currentKey) as Y.Map<unknown> | Y.Array<unknown>
    } else {
      if (isYMap(current) && !current.has(currentKey)) {
        current.set(currentKey, isNextArrayIndex ? new Y.Array() : new Y.Map())
      }

      current = current.get(currentKey as never) as Y.Map<unknown>
    }
  }

  return current
}

function setArrayValue(array: Y.Array<unknown>, index: number, value: unknown): void {
  array.doc?.transact(() => {
    if (array.length - 1 >= index) {
      array.delete(index)
    }

    // If no value is provided, we don't need to insert anything and it acts a a delete transaction
    if (value) {
      array.insert(index, [value])
    }
  })
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
export function toSlateYXmlText(value: string): Y.XmlText {
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

  return lines.map((line) => {
    return {
      id: crypto.randomUUID(),
      class: 'text',
      type: 'core/text',
      children: [{ text: line }]
    }
  })
}
