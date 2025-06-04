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

export async function snapshot(id: string, force?: true, delay: number = 0): Promise<SnapshotResponse> {
  if (!id) {
    throw new Error('UUID is required')
  }


  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  try {
    const url = `${BASE_URL}/api/documents/${id}/snapshot${force === true ? '?force=true' : ''}`
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
      return {
        statusCode: 500,
        statusMessage: ex.message
      }
    } else {
      toast.error(`Lyckades inte spara kopia!`)
      return {
        statusCode: 500,
        statusMessage: 'Unknown error occurred while saving snapshot'
      }
    }
  }
}
