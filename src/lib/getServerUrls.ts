const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  indexUrl: URL
  repositoryEventsUrl: URL
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
      webSocketUrl
    } = await response.json()

    if (typeof indexUrl !== 'string' || indexUrl === '' ||
      typeof repositoryEventsUrl !== 'string' || repositoryEventsUrl === '' ||
      typeof webSocketUrl !== 'string' || webSocketUrl === '') {
      throw new Error('One or several server urls are empty')
    }

    return {
      webSocketUrl: new URL(webSocketUrl),
      indexUrl: new URL(indexUrl),
      repositoryEventsUrl: new URL(repositoryEventsUrl)
    }
  } catch (ex) {
    throw new Error('Failed fetching remote server urls', { cause: ex as Error })
  }
}
