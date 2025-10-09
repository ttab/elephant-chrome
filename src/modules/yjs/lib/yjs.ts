import * as Y from 'yjs'
import type { EleDocumentResponse } from '@/shared/types'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import createHash from '@/shared/createHash'
import { toYMap } from '@/shared/transformations/toYMap'
import type { TBElement } from '@ttab/textbit'
import { isTextEntry } from '@/shared/transformations/isTextEntry'

export type YPath = [string, ...(string | number)[]]

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown>
    ? DeepPartial<T[P]> // Recursively apply partial updates
    : T[P]
}

type YjsContainer = Y.Map<unknown> | Y.Array<unknown> | Y.Text | Y.XmlText | Y.XmlFragment | Y.XmlElement

/*
 * Create a typed YJS document from a given object.
 * @deprecated Use createYjsNewsYDoc() in @/shared/transformations
 */
export function createTypedYDoc(
  data?: EleDocumentResponse,
  options?: {
    document?: Y.Doc
    rootMap?: string
    metaMap?: string
    isInProgress?: boolean
  }
): Y.Doc {
  // Base document and base maps
  const ydoc = options?.document ?? new Y.Doc()
  const yMap = ydoc.getMap(options?.rootMap ?? 'ele')
  const yMeta = ydoc.getMap(options?.metaMap ?? '__meta')

  // Setup __meta (system only information about the document)
  if (options && typeof options.isInProgress === 'boolean') {
    yMeta.set('isInProgress', options.isInProgress)
  }

  if (!data?.document) {
    return ydoc
  }

  const { meta, links, content, ...properties } = data.document
  yMap.set('meta', toYMap(meta))
  yMap.set('links', toYMap(links))
  yMap.set('root', toYMap(properties, new Y.Map()))

  if (typeof content === 'string') {
    // Text string to textbit elements YXmlText
    yMap.set('content', toSlateYXmlText(content))
  } else {
    // Textbit elements to YXmlText
    const yContent = new Y.XmlText()
    yContent.applyDelta(
      slateNodesToInsertDelta(content)
    )

    yMap.set('content', yContent)
  }

  // Set version and original hash
  yMeta.set('version', data.version)
  yMeta.set('hash', createHash(JSON.stringify(yMap.toJSON())))

  return ydoc
}

export function getValueFromPath<T>(root: unknown, path: YPath): T | undefined {
  let current = root

  for (const key of path) {
    if (current instanceof Y.Map && typeof key === 'string') {
      current = current.get(key)
    } else if (current instanceof Y.Array && typeof key === 'number') {
      current = current.get(key)
    } else {
      return undefined
    }
  }

  return current as T | undefined
}

/**
 * Set a value at the specified path. Will transform the value if necessary.
 *
 * @param yRoot Y.Map - Root Y.Map or Y.Array
 * @param path string - Path from yRoot including the index or property
 * @param value unknown
 */
export function setValueByPath<T>(ystruct: Y.Map<unknown> | Y.Array<unknown>, path: YPath, newValue: T) {
  const current = getParent(ystruct, path)
  if (!current) {
    return false
  }

  const finalKey = path[path.length - 1]

  if (current instanceof Y.Map && typeof finalKey === 'string') {
    current.set(
      finalKey,
      toYStructure(newValue)
    )
  } else if (current instanceof Y.Array && typeof finalKey === 'number') {
    if (ystruct.doc) {
      // When part of a document we can do this in a transaction
      ystruct.doc.transact(() => {
        setArrayValue(current, finalKey, newValue)
      })
    } else {
      // Without transaction
      setArrayValue(current, finalKey, newValue)
    }
  }
}

function getParent(yRoot: Y.Map<unknown> | Y.Array<unknown>, yPath: YPath): Y.Map<unknown> | Y.Array<unknown> | undefined {
  let current = yRoot

  for (let i = 0; i < yPath.length - 1; i++) {
    const currentKey = yPath[i]
    const isArrayIndex = typeof currentKey === 'number'
    const isNextArrayIndex = typeof yPath[i + 1] === 'number'

    if (isArrayIndex) {
      if (current instanceof Y.Map) {
        throw new Error(`Invalid path. Expected an array, but encountered a map at '${currentKey}'.`)
      }

      current = current.get(currentKey) as Y.Map<unknown> | Y.Array<unknown>
    } else {
      if (current instanceof Y.Map && !current.has(currentKey)) {
        current.set(currentKey, isNextArrayIndex ? new Y.Array() : new Y.Map())
      }

      current = current.get(currentKey as never) as Y.Map<unknown>
    }
  }

  return current
}

/**
 * Set an array value in a Yjs array. Will push if the index is out of bounds,
 * otherwise it will insert at the specified index replacing what was there.
 *
 * Replacing is a two step process. First the element at the index is deleted,
 * then the new value is inserted at the same index.
 * It is the callers responsibility to do this in a transaction if possible.
 *
 * @param {Y.Array<T>} yarray - yjs array
 * @param {number} finalKey - index of the element to set
 * @param {T} newValue - new value to set
 */
function setArrayValue<T>(yarray: Y.Array<unknown>, finalKey: number, newValue: T) {
  if (finalKey < yarray.length) {
    yarray.delete(finalKey, 1)
  }

  if (typeof newValue !== 'undefined' && newValue !== null) {
    if (finalKey + 1 > yarray.length) {
      yarray.push([newValue])
    } else {
      yarray.insert(finalKey, [newValue])
    }
  }
}

/*
 * Recursively extracts data from a YJS structure
 */
export function extractYData<T>(y: Y.Map<unknown> | Y.Array<unknown> | Y.XmlText): T {
  if (y instanceof Y.XmlText) {
    return y.toString() as T
  }

  if (y instanceof Y.Map) {
    const result: Record<string, unknown> = {}

    for (const [key, value] of y.entries()) {
      if (value instanceof Y.Map || value instanceof Y.Array || value instanceof Y.XmlText) {
        result[key] = extractYData(value)
      } else {
        result[key] = value
      }
    }

    return result as T
  }

  if (y instanceof Y.Array) {
    return y.toArray().map((item) =>
      item instanceof Y.Map || item instanceof Y.Array || item instanceof Y.XmlText
        ? extractYData(item)
        : item
    ) as T
  }

  throw new Error('Unsupported Yjs type')
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

/*
 * Recursively updates a Y.Map key
 *
 * @example
 * updateYMap(document.get('document'), { meta: { priority: Number(value) } })
 */
export function updateYMap<T extends Record<string, unknown>>(ymap: Y.Map<unknown>, newData: DeepPartial<T>) {
  function update<U extends Record<string, unknown>>(target: Y.Map<unknown>, data: DeepPartial<U>) {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        const yarray = new Y.Array<unknown>()
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            const childMap = new Y.Map<unknown>()
            update(childMap, item as DeepPartial<Record<string, unknown>>)
            yarray.push([childMap])
          } else {
            yarray.push([item])
          }
        })
        target.set(key, yarray)
      } else if (typeof value === 'object' && value !== null) {
        let existingYMap = target.get(key) as Y.Map<unknown> | undefined
        if (!(existingYMap instanceof Y.Map)) {
          existingYMap = new Y.Map<unknown>()
          target.set(key, existingYMap)
        }
        update(existingYMap, value as DeepPartial<Record<string, unknown>>)
      } else {
        target.set(key, value)
      }
    }
  }

  ymap.doc?.transact(() => {
    update(ymap, newData)
  })
}

/**
 * Converts a string path to the same array path format used by yjs maintaining
 * the difference between strings for map properties and numbers for array positions.
 *
 * Example:
 * 'meta.myArray[1].value' -> ['meta', 'myArray', 1, 'value]
 */
export function stringToYPath(input: string): YPath {
  const result: Partial<YPath> = []
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

  return result as YPath
}

/**
 * Convert a Yjs path array to a string representation.
 * Numeric indices are wrapped in brackets, string keys are separated by dots.
 *
 * @param {(string | number)[]} path - The path array to convert.
 * @returns {string} The string representation of the path.
 * @example
 * yPathToString(['meta', 'assignments', 0, 'title']) // 'meta.assignments[0].title'
 */
export function yPathToString(path: (string | number)[]): string {
  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`
    }
    return index === 0 ? segment : `${acc}.${segment}`
  }, '')
}

/**
 * Get the path of a Yjs value within its parent structure.
 *
 * @param {Y.AbstractType<unknown>} value - The Yjs value to get the path for.
 * @param {boolean} asString - Optionally return as string if true.
 * @returns {(string | number)[]} The path of the Yjs value as an array of strings and numbers.
 */
export function getYjsPath(value: YjsContainer | undefined, asString: true): string
export function getYjsPath(value: YjsContainer | undefined, asString?: false): (string | number)[]
export function getYjsPath(value: YjsContainer | undefined, asString: boolean): string | (string | number)[]
export function getYjsPath(
  v?: YjsContainer,
  asString: boolean = false
): (string | number)[] | string {
  const path: (string | number)[] = []

  let current = v
  while (current?._item) {
    const { parent, parentSub } = current._item

    if (parent instanceof Y.Map) {
      path.unshift(parentSub as string)
      current = parent as YjsContainer
    } else if (parent instanceof Y.Array) {
      const index = parent.toArray().indexOf(current)
      path.unshift(index)
      current = parent as YjsContainer
    } else {
      break
    }
  }

  return asString ? yPathToString(path) : path
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

/**
 * Typeguard for Record<string, unknown>
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && value.constructor === Object
}
