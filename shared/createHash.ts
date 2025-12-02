import type * as Y from 'yjs'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') return false
  const proto: unknown = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

// Create a stable JSON stringify that sorts object keys so that we can properly create
// hashes that are independent of insertion order.
const stableJSONStringify = (value: unknown): string => (
  JSON.stringify(value, (_key, currentValue: unknown) => {
    if (!isPlainObject(currentValue)) return currentValue

    const record = currentValue
    const sortedKeys = Object.keys(record).sort()

    return sortedKeys.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = record[key]
      return acc
    }, {})
  })
)

// Since window:crypto isn't compatible with node:crypto
// and we don't need a cryptographically secure hash we can use this simple hash function.
//
// Taken from https://stackoverflow.com/a/15710692
function createHash(yMap: Y.Map<unknown>): number {
  const serialized = stableJSONStringify(yMap.toJSON())

  let hash = 0
  for (let i = 0; i < serialized.length; i += 1) {
    hash = ((hash << 5) - hash) + serialized.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export default createHash
