import * as Y from 'yjs'
import type { EleDocumentResponse } from '@/shared/types/index.js'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import createHash from '@/shared/createHash.js'
import { toYMap } from '@/shared/transformations/toYMap.js'
import type { TBElement } from '@ttab/textbit'
import { isTextEntry } from './transformations/isTextEntry.js'
import { isNumber, isRecord, isYArray, isYContainer, isYMap, isYXmlText } from '../src/lib/isType.js'
export type YPath = [string, ...(string | number)[]]

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown>
    ? DeepPartial<T[P]> // Recursively apply partial updates
    : T[P]
}

type YjsContainer = Y.Map<unknown> | Y.Array<unknown> | Y.Text | Y.XmlText | Y.XmlFragment | Y.XmlElement
type YParent = Y.Array<unknown> | Y.Map<unknown> | undefined

/*
 * Create a typed YJS document from a given object.
 * @deprecated Use createYjsNewsYDoc() in @/shared/transformations
 */
export function createTypedYDoc(
  data?: EleDocumentResponse,
  options?: {
    document?: Y.Doc
    rootMap?: string
    ctxMap?: string
    isInProgress?: boolean
  }
): Y.Doc {
  // Base document and base maps
  const ydoc = options?.document ?? new Y.Doc()
  const yEle = ydoc.getMap(options?.rootMap ?? 'ele')
  const yCtx = ydoc.getMap(options?.ctxMap ?? 'ctx')

  // Setup ctx (system only information about the document)
  if (options && typeof options.isInProgress === 'boolean') {
    yCtx.set('isInProgress', options.isInProgress)
  }

  if (!data?.document) {
    return ydoc
  }

  const { meta, links, content, ...properties } = data.document
  yEle.set('meta', toYMap(meta))
  yEle.set('links', toYMap(links))
  yEle.set('root', toYMap(properties, new Y.Map()))

  if (typeof content === 'string') {
    // Text string to textbit elements YXmlText
    yEle.set('content', toSlateYXmlText(content))
  } else {
    // Textbit elements to YXmlText
    const yContent = new Y.XmlText()
    yContent.applyDelta(
      slateNodesToInsertDelta(content)
    )

    yEle.set('content', yContent)
  }

  // Set version and original hash
  yCtx.set('version', data.version)
  yCtx.set('hash', createHash(yEle))

  return ydoc
}

export function getValueFromPath<T>(root: unknown, path: YPath | string, raw = false): T | undefined {
  let current = root

  const yPath = Array.isArray(path) ? path : stringToYPath(path)

  for (const key of yPath) {
    if (current instanceof Y.Map && typeof key === 'string') {
      current = current.get(key)
    } else if (current instanceof Y.Array && typeof key === 'number') {
      current = current.get(key)
    } else {
      return undefined
    }
  }

  return (!raw && (current instanceof Y.Map || current instanceof Y.Array || current instanceof Y.XmlText))
    ? fromYStructure(current)
    : current as T | undefined
}

/**
 * Set a value at the specified path. Will transform the value if necessary.
 *
 * @param yRoot Y.Map - Root Y.Map or Y.Array
 * @param path string - Path from yRoot including the index or property
 * @param value unknown
 */
export function setValueByPath<T>(ystruct: Y.Map<unknown> | Y.Array<unknown>, path: YPath | string, newValue: T): boolean {
  const yPath = Array.isArray(path) ? path : stringToYPath(path)
  const current = getParent(ystruct, yPath)
  if (!current) {
    return false
  }

  const finalKey = yPath[yPath.length - 1]

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
  } else {
    return false
  }

  return true
}

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

  return setValueByPath(yRoot, path, value)
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
 *
 * ATTENTION: It is the callers responsibility to do this in a transaction if possible.
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
  const yStructure = (yPath.length) ? getValueFromPath(yRoot, yPath, true) : yRoot

  if (isYMap(yStructure) && typeof idx === 'string' && yStructure.has(idx)) {
    yStructure.delete(idx)
    return true
  } else if (isYArray(yStructure) && typeof idx === 'number' && yStructure.length > idx) {
    yStructure.delete(idx)
    return true
  }

  return false
}

/*
 * Recursively extracts data from a YJS structure
 */
export function fromYStructure<T>(y: Y.Map<unknown> | Y.Array<unknown> | Y.XmlText): T {
  if (y instanceof Y.XmlText) {
    return y.toString() as T
  }

  if (y instanceof Y.Map) {
    const result: Record<string, unknown> = {}

    for (const [key, value] of y.entries()) {
      if (value instanceof Y.Map || value instanceof Y.Array || value instanceof Y.XmlText) {
        result[key] = fromYStructure(value)
      } else {
        result[key] = value
      }
    }

    return result as T
  }

  if (y instanceof Y.Array) {
    return y.toArray().map((item) =>
      item instanceof Y.Map || item instanceof Y.Array || item instanceof Y.XmlText
        ? fromYStructure(item)
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
 * Check if a Y.Array change affects an observed path. True if the
 * change occurs in any array on any level above an observed value.
 */
export function doesArrayChangeAffectPath(
  event: Y.YEvent<Y.Array<unknown>>,
  observedPath: YPath
): boolean {
  const eventPathStr = event.path.join('.')

  // Find the deepest array index in our observed path that matches this event
  for (let i = observedPath.length - 1; i >= 0; i--) {
    if (typeof observedPath[i] !== 'number') {
      continue
    }

    // Check if the event path matches the path up to this array
    const pathUpToArray = observedPath.slice(0, i)
    const pathUpToArrayStr = pathUpToArray.join('.')

    if (eventPathStr !== pathUpToArrayStr) {
      continue
    }

    const observedIndex = observedPath[i] as number

    // Check if any operation in the delta affects our index
    let currentIndex = 0

    for (const op of event.changes.delta) {
      if (op.retain) {
        currentIndex += op.retain
      } else if (op.insert) {
        const insertCount = Array.isArray(op.insert) ? op.insert.length : 1

        // Items inserted at or before our index shift our item
        if (currentIndex <= observedIndex) {
          return true
        }

        currentIndex += insertCount
      } else if (op.delete) {
        const deleteStart = currentIndex

        // Deletion at or before our index affects us
        if (deleteStart <= observedIndex) {
          return true
        }
      }
    }
  }

  return false
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
