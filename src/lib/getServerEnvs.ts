import {
  resolveServicePublicUrl,
  type ServicePublicUrlOverrides
} from '@/shared/servicePublicUrl'

const BASE_URL = import.meta.env.BASE_URL || ''

interface ServerUrls {
  webSocketUrl: URL
  imageSearchUrl: URL
  faroUrl: URL
}

interface ServerEnvs {
  systemLanguage: string
  imageSearchProvider: string
  environment: string
}

type FeatureFlags = Record<string, boolean>

export interface ServerConfig {
  urls: ServerUrls
  envs: ServerEnvs
  featureFlags: FeatureFlags
  resolveServiceUrl: (name: string) => URL
}

export async function getServerEnvs(): Promise<ServerConfig> {
  const response = await fetch(`${BASE_URL}/api/envs`)

  if (!response.ok) {
    throw new Error(`Failed fetching server envs, got response ${response.status}`)
  }

  try {
    const data = await response.json() as Record<string, unknown>

    const basePublicApiUrl = typeof data.basePublicApiUrl === 'string' ? data.basePublicApiUrl : ''
    const servicePublicUrlOverrides = (
      typeof data.servicePublicUrlOverrides === 'object' && data.servicePublicUrlOverrides !== null
        ? data.servicePublicUrlOverrides as ServicePublicUrlOverrides
        : {}
    )

    const webSocketUrl = parseDirectUrl(data, 'webSocketUrl')
    const imageSearchUrl = parseDirectUrl(data, 'imageSearchUrl')
    const faroUrl = parseDirectUrl(data, 'faroUrl')

    if (!data.systemLanguage || typeof data.systemLanguage !== 'string') {
      throw new Error('missing \'systemLanguage\' server environment variable')
    }

    if (!data.environment || typeof data.environment !== 'string') {
      throw new Error('missing \'environment\' server environment variable')
    }

    const cache = new Map<string, URL>()
    const resolveServiceUrl = (name: string): URL => {
      const cached = cache.get(name)
      if (cached) {
        return cached
      }
      const url = new URL(resolveServicePublicUrl(name, basePublicApiUrl, servicePublicUrlOverrides))
      cache.set(name, url)
      return url
    }

    return {
      urls: { webSocketUrl, imageSearchUrl, faroUrl },
      envs: {
        systemLanguage: data.systemLanguage,
        imageSearchProvider: typeof data.imageSearchProvider === 'string' ? data.imageSearchProvider : '',
        environment: data.environment
      },
      featureFlags: {
        hasPrint: data['hasPrint'] ? !!data['hasPrint'] : false,
        hasHast: data['hasHast'] ? !!data['hasHast'] : false,
        hasLooseSlugline: data['hasLooseSlugline'] ? !!data['hasLooseSlugline'] : false
      },
      resolveServiceUrl
    }
  } catch (ex) {
    const cause = ex instanceof Error ? ex : undefined
    const detail = cause?.message ? `: ${cause.message}` : ''
    throw new Error(`Failed fetching server envs${detail}`, { cause })
  }
}

function parseDirectUrl(data: Record<string, unknown>, field: string): URL {
  const value = data[field]
  if (typeof value !== 'string' || value === '') {
    throw new Error(`missing '${field}' server URL`)
  }
  return new URL(value)
}
