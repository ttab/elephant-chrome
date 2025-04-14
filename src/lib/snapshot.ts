import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL

export async function snapshot(uuid: string): Promise<{ statusCode: number, statusMessage: string } | undefined> {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  try {
    const response = await fetch(`${BASE_URL}/api/snapshot/${uuid}`)

    if (response.status === 404) {
      return
    }

    if (!response.ok) {
      throw new Error(`Error fetching snapshot: ${response.statusText}`)
    }

    console.log('Snapshot response:', response)

    const data = await response.json() as { statusCode: number, statusMessage: string }
    return data
  } catch (ex) {
    if (ex instanceof Error) {
      console.error('Failed to save snapshot:', ex.message)
    }

    toast.error('Lyckades inte spara kopia')
  }
}
