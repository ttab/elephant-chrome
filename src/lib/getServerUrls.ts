const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  indexUrl: URL
  repositoryUrl: URL
  repositoryEventsUrl: URL
  contentApiUrl: URL
  spellcheckUrl: URL
  userUrl: URL
  faroUrl: URL
  baboonUrl: URL
}

export async function getServerUrls(): Promise<ServerUrls> {
  const response = await fetch(`${BASE_URL}/api/urls`)

  if (!response.ok) {
    throw new Error(`Failed fetching remote server urls, got response ${response.status}`)
  }

  try {
    const servers = await response.json() as Record<string, string>
    const attributes = [
      'webSocketUrl', 'indexUrl', 'repositoryUrl', 'contentApiUrl',
      'spellcheckUrl', 'userUrl', 'faroUrl', 'baboonUrl'
    ]

    const urls = {} as Record<string, URL>

    for (const field of attributes) {
      const value = servers[field]

      if (typeof value != 'string' || value == '') {
        throw new Error(`missing '${field}' server URL`)
      }

      urls[field] = new URL(value)
    }

    urls['repositoryEventsUrl'] = new URL('/sse', urls['repositoryUrl'])

    return urls as unknown as ServerUrls
  } catch (ex) {
    throw new Error('Failed fetching remote server urls in getServerUrls', { cause: ex as Error })
  }
}
