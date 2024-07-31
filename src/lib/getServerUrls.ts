const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  indexUrl: URL
  repositoryEventsUrl: URL
  contentApiUrl: URL
}

export async function getServerUrls(): Promise<ServerUrls> {
  const response = await fetch(`${BASE_URL}/api/urls`)

  if (!response.ok) {
    throw new Error(`Failed fetching remote server urls, got response ${response.status}`)
  }

  try {
    const {
      indexUrl,
      repositoryEventsUrl,
      webSocketUrl,
      contentApiUrl
    } = await response.json()

    if (typeof indexUrl !== 'string' || indexUrl === '' ||
      typeof repositoryEventsUrl !== 'string' || repositoryEventsUrl === '' ||
      typeof webSocketUrl !== 'string' || webSocketUrl === '' ||
      typeof contentApiUrl !== 'string' || contentApiUrl === ''
    ) {
      throw new Error('One or several server urls are empty')
    }

    return {
      webSocketUrl: new URL(webSocketUrl),
      indexUrl: new URL(indexUrl),
      repositoryEventsUrl: new URL(repositoryEventsUrl),
      contentApiUrl: new URL(contentApiUrl)
    }
  } catch (ex) {
    throw new Error('Failed fetching remote server urls', { cause: ex as Error })
  }
}
