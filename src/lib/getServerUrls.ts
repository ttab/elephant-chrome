const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  indexUrl: URL
}

export async function getServerUrls(): Promise<ServerUrls | undefined> {
  const response = await fetch(`${BASE_URL}/api/init`)

  if (!response.ok) {
    return
  }

  const urls = await response.json()
  return {
    webSocketUrl: new URL(urls?.WS_URL as string || 'http://localhost'),
    indexUrl: new URL(urls?.INDEX_URL as string || 'http://localhost')
  }
}
