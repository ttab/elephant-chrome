import { useEffect, useState } from 'react'
import { type JWTPayload } from 'jose'

export interface ElephantSession {
  jwt?: JWTPayload
  loading: boolean
  error?: string
}

export const useSession = (endpoint: string): ElephantSession => {
  const [jwt, setJwt] = useState<JWTPayload | undefined>()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch(`${endpoint}/api/user`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Unable to fetch session')
        }

        const json = await response.json()
        setJwt(json)
        setLoading(false)
      } catch (ex) {
        const error = (ex instanceof Error) ? ex.message : JSON.stringify(ex)
        setError(error)
        setLoading(false)
      }
    }
    fetchData().catch((err) => {
      setError(err)
      setLoading(false)
    })
  }, [document.cookie])

  return {
    jwt,
    loading,
    error
  }
}

export default useSession
