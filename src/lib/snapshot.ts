const BASE_URL = import.meta.env.BASE_URL

type SnapshotResponse = {
  statusCode: number
  statusMessage: string
} | {
  version: string
  uuid: string
  statusMessage: undefined
} | undefined

export async function snapshot(uuid: string, force?: true, delay: number = 0): Promise<SnapshotResponse> {
  if (!uuid) {
    throw new Error('UUID is required')
  }


  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  try {
    const url = `${BASE_URL}/api/snapshot/${uuid}${force === true ? '?force=true' : ''}`
    const response = await fetch(url)
    const data = await response.json() as SnapshotResponse

    if (!response.ok) {
      return {
        statusCode: response.status,
        statusMessage: (data && typeof data?.statusMessage === 'string')
          ? data.statusMessage
          : response.statusText
      }
    }

    return data
  } catch (ex) {
    const msg = (ex instanceof Error) ? ex.message : 'Failed saving snapshot'
    console.error(msg)

    return {
      statusCode: -1,
      statusMessage: msg
    }
  }
}
