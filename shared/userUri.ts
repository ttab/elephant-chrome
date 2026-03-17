import { v5 as uuidv5 } from 'uuid'

const USER_URI_PREFIXES = ['core://user/', 'keycloak://user/'] as const

/**
 * Extract the user ID from a user URI.
 * Handles core://user/{id}, core://user/sub/{id}, and keycloak://user/{id}.
 * Returns undefined for URIs that don't match a known prefix.
 */
export function extractUserIdFromUri(
  uri: string
): string | undefined {
  if (!uri) return undefined

  const prefix = USER_URI_PREFIXES.find((p) => uri.startsWith(p))
  if (!prefix) return undefined

  const rest = uri.slice(prefix.length)
  if (!rest) return undefined

  // For core://user/sub/{id} legacy format, take the last segment
  const lastSlash = rest.lastIndexOf('/')
  return lastSlash === -1 ? rest : rest.slice(lastSlash + 1)
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
