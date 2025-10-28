export function isEqualDeep(a: unknown, b: unknown): boolean {
  // Handle cases where one or both values are null or undefined (whence the double = and not triple =)
  if (a == null || b == null) {
    return a === b
  }

  // Ensure both objects are of the same constructor/type
  if (a.constructor !== b.constructor) {
    return false
  }

  // Primitive comparison (same reference or same value)
  if (a === b) {
    return true
  }

  // Now we handle specific object types
  switch (a.constructor) {
    case ArrayBuffer: {
      const aBuffer = new Uint8Array(a as ArrayBuffer)
      const bBuffer = new Uint8Array(b as ArrayBuffer)

      return isEqualDeep(aBuffer, bBuffer)
    }

    case Uint8Array: {
      const aTyped = a as Uint8Array
      const bTyped = b as Uint8Array

      if (aTyped.byteLength !== bTyped.byteLength) {
        return false
      }

      for (let i = 0; i < aTyped.byteLength; i++) {
        if (aTyped[i] !== bTyped[i]) {
          return false
        }
      }

      return true
    }

    case Set: {
      const aSet = a as Set<unknown>
      const bSet = b as Set<unknown>

      if (aSet.size !== bSet.size) {
        return false
      }

      for (const value of aSet) {
        if (!bSet.has(value)) {
          return false
        }
      }

      return true
    }

    case Map: {
      const aMap = a as Map<unknown, unknown>
      const bMap = b as Map<unknown, unknown>

      if (aMap.size !== bMap.size) {
        return false
      }

      for (const key of aMap.keys()) {
        if (!bMap.has(key) || !isEqualDeep(aMap.get(key), bMap.get(key))) {
          return false
        }
      }

      return true
    }

    case Object: {
      const aObj = a as Record<string, unknown>
      const bObj = b as Record<string, unknown>

      const aKeys = Object.keys(aObj)
      const bKeys = Object.keys(bObj)

      if (aKeys.length !== bKeys.length) {
        return false
      }

      for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(bObj, key) || !isEqualDeep(aObj[key], bObj[key])) {
          return false
        }
      }

      return true
    }

    case Array: {
      const aArray = a as unknown[]
      const bArray = b as unknown[]

      if (aArray.length !== bArray.length) {
        return false
      }

      for (let i = 0; i < aArray.length; i++) {
        if (!isEqualDeep(aArray[i], bArray[i])) {
          return false
        }
      }

      return true
    }

    default:
      return false
  }
}
