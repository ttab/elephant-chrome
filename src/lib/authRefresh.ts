import { type JWT } from '@/types'

export async function authRefresh(): Promise<JWT | undefined> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL || ''}/api/user`, {
      credentials: 'include'
    })

    if (response.status === 401) {
      console.error('Fetching session token failed with status 401 Unauthorized')
      return undefined
    }

    if (!response.ok) {
      console.error(`Fetching session token failed with status ${response.status}`)
      return undefined
    }

    const jwt: JWT = await response.json()
    return (jwt?.exp) ? jwt : undefined
  } catch (ex) {
    console.error('Fetching session token failed due to unexpected error', ex)
    return undefined
  }
}
