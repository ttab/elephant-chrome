import { useCallback } from 'react'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL

export const useSnapshot = () => {
  const snapshot = useCallback(async (uuid: string) => {
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

      const data = await response.json() as { statusCode: number, statusMessage: string }
      return data
    } catch (ex) {
      if (ex instanceof Error) {
        console.error('Failed to save snapshot:', ex.message)
      }

      toast.error('Lyckades inte spara kopia')
    }
  }, [])

  return snapshot
}
