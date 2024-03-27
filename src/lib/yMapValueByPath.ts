import * as Y from 'yjs'

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
    if (current instanceof Y.Map && current?.has?.(key)) {
      current = current.get(key) as Y.Map<unknown>
      // Handle array index notation
    } else if (!isNaN(Number(key)) && current instanceof Y.Array) {
      current = (current as Y.Array<unknown>).get(Number(key)) as Y.Map<unknown>
    } else {
      return // Return undefined if the key doesn't exist
    }
  }

  return current
}

/*
  * Traverse Y.Map and SET value by provided path
  * @param {Y.Map} ymap
  * @param string path
  * @param string value
  * @return void
*/
export function set(ymap: Y.Map<unknown>, path: string, value: unknown): void {
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
    // Check if valid index
    if (!isNaN(index)) {
      // When index is within array bounds
      if (current.length - 1 >= index) {
        current.doc?.transact(() => {
          current.delete(index)
          current.insert(index, [value])
        })
        return
      }

      // Create structure
      if (current.doc) {
        current.doc.transact(() => {
          Array.from(Array(index + 1)).forEach((_, transactIndex) => {
            const transactValue = transactIndex === index
              ? value
              : null

            const hasValue = !!current.get(transactIndex)
            if (!hasValue) {
              current.length - 1 >= transactIndex && current.delete(transactIndex)
              current.insert(transactIndex, [transactValue])
            }
          })
        })
      }

    // When not valid index
    } else {
      throw new Error(`Invalid array index '${keys[keys.length - 1]}'`)
    }
  }
}
