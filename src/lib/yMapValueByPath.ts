import * as Y from 'yjs'

/**
 * @deprecated
 */
export function get(y: Y.Map<unknown> | undefined, path?: string): Y.Map<unknown> | undefined {
  if (!y) {
    return
  }

  const keys = path
    ?.replace(/(\[|\])/g, '.')
    .split('.')
    .filter(x => x) || ''

  let current = y

  for (const key of keys) {
    // Get value from map by key
    if (current instanceof Y.Map && current?.has?.(key)) {
      current = current.get(key) as Y.Map<unknown>

      // Get value from array using index notation
    } else if (!isNaN(Number(key)) && current instanceof Y.Array) {
      current = (current as Y.Array<unknown>).get(Number(key)) as Y.Map<unknown>
    } else {
      // Return undefined if key doesn't exist
      return
    }
  }

  return current
}

/*
 * Traverse Y.Map and SET value by provided path, deprecated.
 *
 * @deprecated
 *
 * @param {Y.Map} ymap
 * @param string path
 * @param string value
 * @return void
 */
export function set(ymap: Y.Map<unknown>, path: string, value: unknown): void {
  const keys: string[] = path
    .replace(/(\[|\])/g, '.')
    .split('.')
    .filter(x => x !== '')

  let current: Y.Map<unknown> | Y.Array<unknown> | undefined = ymap

  // Traverse to the parent YMap or YArray that will hold the new key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const isArrayIndex = /^\d+$/.test(key)
    const nextIsArrayIndex = /^\d+$/.test(keys[i + 1])

    if (current) {
      if (isArrayIndex) {
        const arrayIndex = parseInt(key, 10)

        if (current instanceof Y.Map) {
          throw new Error(`Invalid path. Expected an array, but encountered a map at '${key}'.`)
        }

        current = current.get(arrayIndex) as Y.Map<unknown> | Y.Array<unknown>
      } else {
        if (current instanceof Y.Map && !current.has(key)) {
          if (nextIsArrayIndex) {
            current.set(key, new Y.Array())
          } else {
            current.set(key, new Y.Map())
          }
        }

        current = current.get(key as never) as Y.Map<unknown>
      }
    }
  }

  // Set the value in the nested YMap or YArray
  if (current instanceof Y.Map) {
    current.set(keys[keys.length - 1], value)
    return
  }

  // Should be an array, else throw error
  if (!(current instanceof Y.Array)) {
    throw new Error(`Expected Y.Map or Y.Array but encountered ${typeof current}`)
  }

  // Check if valid index
  const index = parseInt(keys[keys.length - 1], 10)
  if (isNaN(index)) {
    throw new Error(`Invalid array index '${keys[keys.length - 1]}'`)
  }

  // When index is within array bounds
  if (current.length - 1 >= index) {
    current.doc?.transact(() => {
      current.delete(index)
      current.insert(index, [value])
    })
    return
  }

  // Last fallback. Create structure
  // To be able to create a value at an index out of bounds, we need to create the structure
  if (current.doc) {
    current.doc.transact(() => {
      Array.from(Array(index + 1)).forEach((_, transactIndex) => {
        // Determine value for current transactIndex
        const transactValue = transactIndex === index
          ? value
          : null

        const hasValue = !!current.get(transactIndex)

        // If value doesn't exist, insert it.
        // Either transactValue if it's the index we're looking for, or null
        if (!hasValue) {
          if (current.length - 1 >= transactIndex) {
            current.delete(transactIndex)
          }
          current.insert(transactIndex, [transactValue])
        }
      })
    })
  }
}
