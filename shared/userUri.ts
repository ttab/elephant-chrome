import { v5 as uuidv5 } from 'uuid'

const USER_URI_PREFIX = 'core://user/'

/**
 * Extract the user ID from a core://user URI.
 * Handles both core://user/{id} and core://user/sub/{id}.
 * Returns undefined for URIs that don't start with core://user/.
 */
export function extractUserIdFromUri(
  uri: string
): string | undefined {
  if (!uri || !uri.startsWith(USER_URI_PREFIX)) return undefined

  const lastSlash = uri.lastIndexOf('/')
  if (lastSlash === -1 || lastSlash === uri.length - 1) {
    return undefined
  }

  return uri.slice(lastSlash + 1)
}

/**
 * Normalize any user URI format to core://user/{id}.
 * Returns the original string unchanged if no ID can be extracted.
 */
export function normalizeUserUri(uri: string): string {
  const id = extractUserIdFromUri(uri)
  if (!id) return uri
  return `core://user/${id}`
}

/**
 * Generate a deterministic UUID v5 for an author document
 * based on the user URI.
 */
export function generateAuthorUUID(userUri: string): string {
  const normalized = normalizeUserUri(userUri)
  return uuidv5(normalized, uuidv5.URL)
}
