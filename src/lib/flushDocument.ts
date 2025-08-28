import * as Y from 'yjs'
const BASE_URL = import.meta.env.BASE_URL

type FlushDocumentResponse = {
  statusCode: number
  statusMessage: string
} | {
  version: string
  uuid: string
  statusMessage: undefined
} | undefined

/**
 * Flush unsaved document changes to primary repository.
 */
export async function flushDocument(
  uuid: string,
  options?: {
    force?: true
    delay?: number
    status?: string
    cause?: string
  },
  document?: Y.Doc): Promise<FlushDocumentResponse> {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  const delay = options?.delay || 0

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  try {
    const url = new URL(`${BASE_URL}/api/documents/${uuid}/flush`, window.location.origin)

    if (options?.force) url.searchParams.set('force', 'true')
    if (options?.status) url.searchParams.set('status', options.status)
    if (options?.cause) url.searchParams.set('cause', options.cause)

    const update = document ? Y.encodeStateAsUpdateV2(document) : null

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: update
    })

    const result = await response.json() as FlushDocumentResponse

    if (!response.ok) {
      return {
        statusCode: response.status,
        statusMessage: (result && typeof result?.statusMessage === 'string')
          ? result.statusMessage
          : response.statusText
      }
    }

    return result
  } catch (ex) {
    const msg = (ex instanceof Error) ? ex.message : 'Failed flushing unsaved changes to primary storage'
    console.error(msg)

    return {
      statusCode: -1,
      statusMessage: msg
    }
  }
}
