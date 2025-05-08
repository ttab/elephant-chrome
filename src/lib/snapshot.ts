import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL

type SnapshotResponse = {
  statusCode: number
  statusMessage: string
} | {
  version: string
  uuid: string
  statusMessage: undefined
} | undefined

export async function snapshot(uuid: string, force?: true): Promise<SnapshotResponse> {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  try {
    const url = `${BASE_URL}/api/snapshot/${uuid}${force === true ? '?force=true' : ''}`
    const response = await fetch(url)
    const data = await response.json() as SnapshotResponse

    if (!response.ok) {
      throw new Error((data && typeof data?.statusMessage === 'string')
        ? data.statusMessage
        : response.statusText)
    }

    return data
  } catch (ex) {
    if (ex instanceof Error) {
      console.error('Failed to save snapshot:', ex.message)
      toast.error(`Lyckades inte spara kopia! ${ex.message}`)
    } else {
      toast.error(`Lyckades inte spara kopia!`)
    }
  }
}
