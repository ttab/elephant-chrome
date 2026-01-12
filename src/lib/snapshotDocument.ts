import * as Y from 'yjs'
const BASE_URL = import.meta.env.BASE_URL

type StoreDocumentResponse = {
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
export async function snapshotDocument(
  uuid: string,
  options?: {
    force?: true
    delay?: number
    status?: string
    cause?: string
    addToHistory?: boolean
  },
  document?: Y.Doc): Promise<StoreDocumentResponse> {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  const delay = options?.delay || 0

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  try {
    const url = new URL(`${BASE_URL}/api/documents/${uuid}/store`, window.location.origin)

    if (options?.force) url.searchParams.set('force', 'true')
    if (options?.status) url.searchParams.set('status', options.status)
    if (options?.cause) url.searchParams.set('cause', options.cause)
    url.searchParams.set('addToHistory', options?.addToHistory === true ? '1' : '0')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      // Send client state as an update, as the local content
      // is what the client expects to be stored.
      // FIXME: We should not have to suppress this
      // @ts-expect-error We should not have to suppress this
      body: document ? Y.encodeStateAsUpdate(document) : null
    })

    const result = await response.json() as StoreDocumentResponse

    if (!response.ok) {
      const message = (result && typeof result === 'object' && 'statusMessage' in result && typeof (result as { statusMessage?: unknown }).statusMessage === 'string')
        ? (result as { statusMessage: string }).statusMessage
        : (response.statusText || `Request failed with status ${response.status}`)
      throw new Error(message || 'Failed storing document snapshot')
    }

    return result
  } catch (ex) {
    const err = ex instanceof Error ? ex : new Error('Failed flushing unsaved changes to primary storage')
    console.error(err)
    throw err
  }
}
