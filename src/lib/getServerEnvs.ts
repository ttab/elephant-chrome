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

interface ServerEnvs {
  systemLanguage: string
}

type FeatureFlags = Record<string, boolean>

interface ServerConfig {
  urls: ServerUrls
  envs: ServerEnvs
  featureFlags: FeatureFlags
}

export async function getServerEnvs(): Promise<ServerConfig> {
  const response = await fetch(`${BASE_URL}/api/envs`)

  if (!response.ok) {
    throw new Error(`Failed fetching server envs, got response ${response.status}`)
  }

  try {
    const data = await response.json() as Record<string, unknown>
    const urlAttributes = [
      'webSocketUrl', 'indexUrl', 'repositoryUrl', 'contentApiUrl',
      'spellcheckUrl', 'userUrl', 'faroUrl', 'baboonUrl'
    ]

    const urls = {} as Record<string, URL>

    for (const field of urlAttributes) {
      const value = data[field]

      if (typeof value !== 'string' || value === '') {
        throw new Error(`missing '${field}' server URL`)
      }

      urls[field] = new URL(value)
    }

    if (!data['systemLanguage'] || typeof data['systemLanguage'] !== 'string') {
      throw new Error('missing \'systemLanguage\' server environment variable')
    }

    return {
      urls: {
        ...urls,
        repositoryEventsUrl: new URL('/sse', urls['repositoryUrl'])
      } as ServerUrls,
      envs: {
        systemLanguage: data['systemLanguage']
      },
      featureFlags: {
        hasPrint: data['hasPrint'] ? !!data['hasPrint'] : false
      }
    }
  } catch (ex) {
    const cause = ex instanceof Error ? ex : undefined
    const detail = cause?.message ? `: ${cause.message}` : ''
    throw new Error(`Failed fetching server envs${detail}`, { cause })
  }
}
