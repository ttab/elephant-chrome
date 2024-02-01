const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  indexUrl: URL
}

export async function getServerUrls(): Promise<ServerUrls> {
  const response = await fetch(`${BASE_URL}/api/init`)

  if (!response.ok) {
    throw new Error(`Failed initializing remote URL:s, got response ${response.status}`)
  }

  const urls = await response.json()
  return {
    webSocketUrl: new URL(urls?.WS_URL as string || 'http://localhost'),
    indexUrl: new URL(urls?.INDEX_URL as string || 'http://localhost')
  }
}
