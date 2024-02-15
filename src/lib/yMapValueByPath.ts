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
 * @param {string} [path - The path of the value to retrieve.
 * @returns {Y.Map<unknown> | Y.Array<unknown> | string | undefined} The retrieved value, or undefined if not found.
 */

export function get<T>(y: Y.Array<unknown>): T[]
export function get<T>(y: Y.Map<unknown>, path?: string): Record<string, T> | string | undefined
export function get<T>(y: Y.Map<unknown> | Y.Array<unknown>, path?: string): T[] | Record<string, T> | string | undefined {
  if (!y) {
    return
  }
  if (!path) {
    return y.toJSON() // Return the original ymap if no path is provided
  }

  // Return Y.Array for observation
  if (y instanceof Y.Array) {
    return y.toJSON()
  }

  const keys: string[] = path.split('.')
  let current = y

  for (const key of keys) {
    if (!current?.has(key)) {
      return undefined // Return undefined if the key doesn't exist
    }
    current = current.get(key) as Y.Map<unknown>
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
  const keys: string[] = path.split('.')
  let current: Y.Map<unknown> | undefined = ymap

  // Traverse to the parent YMap that will hold the new key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current && !current?.has(key)) {
      current.set(key, new Y.Map()) // Create a new YMap if the key doesn't exist
    }
    current = current?.get(key) as Y.Map<unknown> | undefined
  }

  // Set the value in the nested YMap
  if (current) {
    current.set(keys[keys.length - 1], value)
  }
}
