import * as Y from 'yjs'
import { toSlateYXmlText } from './toSlateYXmlText.js'

/**
 * Transform any object to a Y representation
 *
 * @template T - Type of the input data.
 * @param {T} d - The input data to be converted.
 * @param {Y.Map<unknown>} [map=new Y.Map()] - Optional map object to store the converted data. Defaults to a new Y.Map() if not provided.
 * @returns {Y.Map<unknown>} The converted Y.Map object.
 */
export function toYMap<T extends Record<string, unknown>>(d: T, map: Y.Map<unknown> = new Y.Map()): Y.Map<unknown> {
  for (const key in d) {
    const value = d[key]

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        const nestedArray = new Y.Array()
        value.forEach((v: unknown) => nestedArray.push([toYMap(v as Record<string, unknown>, new Y.Map())]))
        map.set(key, nestedArray)
      } else {
        map.set(key, toYMap(value as Record<string, unknown>, new Y.Map()))
      }
    } else if (isTextEntry(key, d.type)) {
      const yXmlText = toSlateYXmlText(value as string)
      map.set(key, yXmlText)
    } else {
      map.set(key, value)
    }
  }

  return map
}

/**
 * Decide whether property should be converted to Y.XmlText,
 * i.e be editable using Textbit.
 *
 * @param {string} key - The property name
 * @param {unknown} t - Type value on the same level as the key
 * @returns {boolean}
 */
function isTextEntry(key: string, t?: unknown): boolean {
  // TODO: This lookup table should live somewhere else or maybe be auto generated from revisor schemas
  const lookupMap: Record<string, string[]> = {
    'tt/slugline': [
      'value'
    ],
    '*': [
      'text', 'title'
    ]
  }

  const type = typeof t === 'string' ? t : ''

  if (lookupMap[type]?.includes(key)) {
    return true
  }

  return lookupMap['*']?.includes(key)
}
