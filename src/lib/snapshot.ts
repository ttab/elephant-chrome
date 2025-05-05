import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL

type SnapshotResponse = Promise<{ statusCode: number, statusMessage: string } | { version: string, uuid: string } | undefined>

export async function snapshot(uuid: string, force?: true): SnapshotResponse {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  try {
    const url = `${BASE_URL}/api/snapshot/${uuid}${force === true ? '?force=true' : ''}`
    const response = await fetch(url)

    if (response.status === 404) {
      return
    }

    if (!response.ok) {
      throw new Error(`Error fetching snapshot: ${response.statusText}`)
    }


    const data = await response.json() as SnapshotResponse
    return data
  } catch (ex) {
    if (ex instanceof Error) {
      console.error('Failed to save snapshot:', ex.message)
    }

    toast.error('Lyckades inte spara kopia')
  }
}
