import * as Y from 'yjs'

/**
 * Retrieves a value from a Y.Map or Y.Array by key.
 * @overload
 * @param {Y.Map<unknown>} y - The Y.Map to retrieve a value from.
 * @param {string} [path] - The path of the value to retrieve.
 * @returns {Y.Map<unknown> | string | undefined} The retrieved value, or undefined if not found.
 *
 * @overload
 * @param {Y.Array<unknown>} y - The Y.Array to retrieve a value from.
 * @returns {Y.Array<unknown>} The retrieved value.
 *
 * @param {Y.Map<unknown> | Y.Array<unknown>} y - The Y.Map or Y.Array to retrieve a value from.
 * @param {string} [path] - The path of the value to retrieve.
 * @returns {Y.Map<unknown> | Y.Array<unknown> | string | undefined} The retrieved value, or undefined if not found.
 */

export function get<T>(y: Y.Array<unknown>, path?: string): T[]
export function get<T>(y: Y.Map<unknown>, path?: string): Record<string, T> | string | undefined
export function get<T>(y: Y.Map<unknown> | Y.Array<unknown>, path?: string): T[] | Record<string, T> | string | undefined {
  if (!y) {
    return
  }

  // Return Y.Array or Y.Map for observation
  if (y instanceof Y.Array && !path) {
    return y.toJSON()
  }

  // @ts-expect-error unknown
  const keys: string[] = path?.replace(/(\[|\])/g, '.').split('.').filter(x => x)
  let current = y

  for (const key of keys) {
    if (current instanceof Y.Map && current?.has?.(key)) {
      current = current.get(key) as Y.Map<unknown>
      // Handle array index notation
    } else if (!isNaN(Number(key)) && current instanceof Y.Array) {
      current = (current).get(Number(key)) as Y.Map<unknown>
    } else {
      return // Return undefined if the key doesn't exist
    }
  }

  return current as unknown as string
}


/*
  * Traverse Y.Map and SET value by provided path
  * @param {Y.Map} ymap
  * @param string path
  * @param string value
  * @return void
*/
export function set(ymap: Y.Map<unknown>, path: string, value: string): void {
  const keys: string[] = path.replace(/(\[|\])/g, '.').split('.').filter(x => x !== '')

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

        if (arrayIndex >= current.length) {
          throw new Error(`Index '${arrayIndex}' out of bounds for array '${keys[i - 1]}'.`)
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
        // @ts-expect-error unknown
        current = current.get(key) as Y.Map<unknown>
      }
    }
  }

  // Set the value in the nested YMap or YArray
  if (current instanceof Y.Map) {
    current.set(keys[keys.length - 1], value)
  } else if (current instanceof Y.Array) {
    const index = parseInt(keys[keys.length - 1], 10)
    if (current.length - 1 >= index) {
      current.delete(index)
      current.insert(index, [value])
    } else {
      current.push([value])
    }
  }
}
