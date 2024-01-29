import { type JWT } from '@/types'

export async function authenticate(user: string, password: string): Promise<JWT | undefined> {
  const BASE_URL = import.meta.env.BASE_URL || ''

  try {
    const response = await fetch(`${BASE_URL}/api/user`, {
      method: 'post',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user,
        password
      })
    })

    if (response.status !== 200) {
      console.error(`Fetching session token failed with status ${response.status}`)
      return undefined
    }

    const jwt: JWT = await response.json()
    return (jwt?.exp) ? jwt : undefined
  } catch (ex) {
    console.error('Authentication failed due to unexpected error', ex)
    return undefined
  }
}
