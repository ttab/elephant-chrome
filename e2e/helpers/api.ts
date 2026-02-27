import { type APIRequestContext, request } from '@playwright/test'
import path from 'node:path'

export const AUTH_FILE = path.resolve(
  import.meta.dirname, '../.auth/user.json'
)

function hasAccessToken(
  obj: Record<string, unknown>
): obj is { accessToken: string } {
  return typeof obj.accessToken === 'string'
}

function isServiceUrlsResponse(
  obj: unknown
): obj is { payload: Record<string, string> } {
  if (typeof obj !== 'object' || obj === null || !('payload' in obj)) {
    return false
  }
  return typeof obj.payload === 'object' && obj.payload !== null
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null
}

/**
 * Extract the session access token by calling the Auth.js session endpoint.
 */
export async function getAccessToken(baseURL: string): Promise<string> {
  const ctx = await request.newContext({
    baseURL,
    storageState: AUTH_FILE
  })

  try {
    const res = await ctx.get('/api/auth/session')

    if (!res.ok()) {
      throw new Error(
        `Session endpoint returned HTTP ${res.status()}. `
        + 'Auth state may be expired — re-run global setup.'
      )
    }

    const session: unknown = await res.json()

    if (!isRecord(session) || !hasAccessToken(session)) {
      const keys = isRecord(session)
        ? Object.keys(session).join(', ')
        : typeof session
      throw new Error(
        'No accessToken in session response. '
        + `Response: [${keys}]. `
        + 'The session may have expired or auth file may be stale.'
      )
    }

    return session.accessToken
  } finally {
    await ctx.dispose()
  }
}

/**
 * Get backend service URLs from the app's /api/urls endpoint.
 * Returns the full response; URLs are nested under the `payload` key.
 */
export async function getServiceUrls(
  ctx: APIRequestContext
): Promise<{ payload: Record<string, string> }> {
  const res = await ctx.get('/api/urls')

  if (!res.ok()) {
    throw new Error(
      `Failed to fetch service URLs: HTTP ${res.status()}`
    )
  }

  const body: unknown = await res.json()

  if (!isServiceUrlsResponse(body)) {
    throw new Error(
      'Unexpected response from /api/urls: missing payload object'
    )
  }

  return body
}

/**
 * Fetch a document by ID via the app's REST API.
 * The request context must include valid auth cookies (use storageState).
 */
export async function getDocument(
  ctx: APIRequestContext,
  documentId: string
): Promise<Record<string, unknown>> {
  const res = await ctx.get(`api/documents/${documentId}`)

  if (!res.ok()) {
    throw new Error(
      `Failed to fetch document '${documentId}': `
      + `HTTP ${res.status()}`
    )
  }

  const body: unknown = await res.json()

  if (!isRecord(body)) {
    throw new Error(
      `Unexpected response for document '${documentId}': `
      + 'expected a JSON object'
    )
  }

  return body
}

/**
 * Restore a document to a specific version via the app's REST API.
 * Resets both the Yjs collaborative state and the Redis snapshot.
 */
export async function restoreDocument(
  baseURL: string,
  documentId: string,
  version: number
): Promise<void> {
  const ctx = await request.newContext({
    baseURL,
    storageState: AUTH_FILE
  })

  try {
    const res = await ctx.post(
      `api/documents/${documentId}/restore?version=${version}`
    )

    if (!res.ok()) {
      throw new Error(
        `Failed to restore document '${documentId}' `
        + `to version ${version}: HTTP ${res.status()}`
      )
    }
  } finally {
    await ctx.dispose()
  }
}
