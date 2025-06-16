import * as Y from 'yjs'
const BASE_URL = import.meta.env.BASE_URL

type SnapshotResponse = {
  statusCode: number
  statusMessage: string
} | {
  version: string
  uuid: string
  statusMessage: undefined
} | undefined

export async function snapshot(
  uuid: string,
  options?: {
    force?: true
    delay?: number
    status?: string
    cause?: string
  },
  document?: Y.Doc): Promise<SnapshotResponse> {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  const delay = options?.delay || 0

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  try {
    const url = new URL(`${BASE_URL}/api/snapshot/${uuid}`, window.location.origin)

    if (options?.force) url.searchParams.set('force', 'true')
    if (options?.status) url.searchParams.set('status', options.status)
    if (options?.cause) url.searchParams.set('cause', options.cause)

    // TODO: v1 or v2
    const update = document ? Y.encodeStateAsUpdateV2(document) : null

    console.log('src/lib/snapshot', url)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: update
    })

    const result = await response.json() as SnapshotResponse
    console.log('Snapshot response', result)

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
    const msg = (ex instanceof Error) ? ex.message : 'Failed saving snapshot'
    console.error(msg)

    return {
      statusCode: -1,
      statusMessage: msg
    }
  }
}
