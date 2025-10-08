import * as Y from 'yjs'
import type { EleDocumentResponse } from '@/shared/types'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

export type YPath = [string, ...(string | number)[]]

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown>
    ? DeepPartial<T[P]> // Recursively apply partial updates
    : T[P]
}

type YjsContainer = Y.Map<unknown> | Y.Array<unknown> | Y.Text | Y.XmlText | Y.XmlFragment | Y.XmlElement

/*
 * Create a typed YJS document from a given object.
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
  const ymap = ydoc.getMap(options?.rootMap ?? 'document')
  const yMeta = ydoc.getMap(options?.metaMap ?? '__meta')

  // Setup __meta (system only information about the document)
  if (options && typeof options.isInProgress === 'boolean') {
    yMeta.set('isInProgress', options.isInProgress)
  }

  if (!data?.document) {
    return ydoc
  }

  function populateYMap(obj: EleDocumentResponse, ymap: Y.Map<unknown>) {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        const yarray = new Y.Array<unknown>()
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            const childMap = new Y.Map<unknown>()
            populateYMap(item as EleDocumentResponse, childMap)
            yarray.push([childMap])
          } else {
            yarray.push([item])
          }
        })
        ymap.set(key, yarray)
      } else if (typeof value === 'object' && value !== null) {
        const childMap = new Y.Map<unknown>()
        populateYMap(value as EleDocumentResponse, childMap)
        ymap.set(key, childMap)
      } else {
        ymap.set(key, value)
      }
    }
  }

  populateYMap(data, ymap)

  // EleDocument specific handling
  const yContent = new Y.XmlText()
  yContent.applyDelta(
    slateNodesToInsertDelta(data.document.content)
  )

  ymap.set('content', yContent)

  // Set version
  const yVersion = ydoc.getMap('version')
  yVersion?.set('version', data.version)

  return ydoc
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

/*
 * Recursively updates a YJS document
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
