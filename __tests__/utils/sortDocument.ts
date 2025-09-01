/*
 * Array order is not guaranteed.
 * Sorts the JSON object recursively so that we can compare the objects
 */
export function sortDocument(json: unknown): unknown {
  if (Array.isArray(json)) {
    return json.map(sortDocument)
      .sort((a, b) => {
        if (typeof a === 'object' && typeof b === 'object') {
          return JSON.stringify(sortDocument(a)).localeCompare(JSON.stringify(sortDocument(b)))
        }
        return JSON.stringify(a).localeCompare(JSON.stringify(b))
      })
  } else if (typeof json === 'object' && json !== null) {
    const sortedObject: Record<string, unknown> = {}
    Object.keys(json).sort().forEach((key) => {
      sortedObject[key] = sortDocument((json as Record<string, unknown>)[key])
    })
    return sortedObject
  }
  return json
}
