import * as Y from 'yjs'
import { isNumber, isRecord, isYArray, isYMap } from './isType'
import { isTextEntry } from '@/shared/transformations/isTextEntry'
import type { TBElement } from '@ttab/textbit'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

export type YParent = Y.Array<unknown> | Y.Map<unknown> | undefined
export type YPath = Array<string | number>

/**
 * Traverse a yjs structure to find the wanted value based on the yjs path.
 *
 * Returns an array with two elements. First the value and then the parent map or array.
 */
export function getValueByYPath<T>(root: Y.Map<unknown>, path: YPath): [T | undefined, YParent] {
  const lastIndex = path.length - 1
  let parent: unknown = root

  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    let current: unknown

    if (isYArray(parent) && isNumber(key)) {
      current = parent.get(key)
    } else if (isYMap(parent) && !isNumber(key)) {
      current = parent?.get(key)
    }

    if (i === lastIndex) {
      return [current as T, parent as YParent]
    }

    parent = current
  }

  return [undefined, undefined]
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
 * Creates a new Y.* structure unto the given path in an existing Y document
 *
 * Path must either point to a Y.Array or a Y.Map property.
 *
 * @param root Y.Map - The root Y.Map of the path
 * @param path YPath | string - Path to set structure
 * @param structure unknown - Value or structure to convert
 * @returns boolean True on success, otherwise false
 */
export function createYStructure(root: Y.Map<unknown>, path: string | YPath, structure: unknown): boolean {
  const yPath = Array.isArray(path) ? path : stringToYPath(path)
  if (!yPath.length) {
    // Empty path
    console.warn('Path given to createYStructure() is empty:', path)
    return false
  }

  const [yValue, yParent] = getValueByYPath(root, yPath)
  if (!yValue && !yParent) {
    // Non existing path
    console.warn('Path given to createYStructure() is non existing:', path)
    return false
  }

  const yStructure = toYStructure(structure)

  if (isYArray(yValue)) {
    // Push given structure onto this existing array
    yValue.push([yStructure])
    return true
  }

  if (isYMap(yParent) && yPath.length >= 2) {
    // Set given structure to the property named by the last part of the path
    yParent.set(yPath.slice(-1).toString(), yStructure)
    return true
  }

  console.warn('Path given to createYStructure() could not be handled')
  return false
}

/**
 * Transform any value/structure to a Y representation.
 *
 * TODO: Can this function replace toYMap()?
 * FIXME: How do we share isTextEntry() and toSlateYXmLText()?
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
