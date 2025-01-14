const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  indexUrl: URL
  repositoryEventsUrl: URL
  repositoryUrl: URL
  contentApiUrl: URL
  spellcheckUrl: URL
  faroUrl: URL
}

export async function getServerUrls(): Promise<ServerUrls> {
  const response = await fetch(`${BASE_URL}/api/urls`)

  if (!response.ok) {
    throw new Error(`Failed fetching remote server urls, got response ${response.status}`)
  }

  try {
    const {
      indexUrl,
      repositoryUrl,
      webSocketUrl,
      contentApiUrl,
      spellcheckUrl,
      faroUrl
    } = await response.json() as ServerUrls


    if (typeof indexUrl !== 'string' || indexUrl === ''
      || typeof repositoryUrl !== 'string' || repositoryUrl === ''
      || typeof webSocketUrl !== 'string' || webSocketUrl === ''
      || typeof contentApiUrl !== 'string' || contentApiUrl === ''
      || typeof spellcheckUrl !== 'string' || spellcheckUrl === ''
      || typeof faroUrl !== 'string' || faroUrl === ''
    ) {
      throw new Error('One or several server urls are empty')
    }


    return {
      webSocketUrl: new URL(webSocketUrl),
      indexUrl: new URL(indexUrl),
      repositoryEventsUrl: new URL('/sse', repositoryUrl),
      repositoryUrl: new URL(repositoryUrl),
      contentApiUrl: new URL(contentApiUrl),
      spellcheckUrl: new URL(spellcheckUrl),
      faroUrl: new URL(faroUrl)
    }
  } catch (ex) {
    throw new Error('Failed fetching remote server urls in getServerUrls', { cause: ex as Error })
  }
}
