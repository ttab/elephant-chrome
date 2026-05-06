import {
  resolveServicePublicUrl,
  type ServicePublicUrlOverrides
} from '@/shared/servicePublicUrl.js'

export type UrlKind = 'public' | 'internal'

export interface ServiceUrlResolver {
  resolveServiceUrl(name: string, kind: UrlKind): string
  getPublicUrlOverrides(): ServicePublicUrlOverrides
  getBasePublicApiUrl(): string
}

const PUBLIC_URL_SUFFIX = '_PUBLIC_URL'
const DEFAULT_INTERNAL_API_NAMES = 'repository:editorial-repository,baboon:baboon'

interface InternalHttpsList {
  all: boolean
  names: Set<string>
}

interface LoadedConfig {
  basePublicApiUrl: string
  publicUrlOverrides: ServicePublicUrlOverrides
  usePublicApisInternally: boolean
  internalApiNames: Record<string, string>
  internalHttpsList: InternalHttpsList
}

/**
 * Load and validate service-URL settings from the given environment (defaults
 * to `process.env`) and return a resolver bound to that snapshot. Call once
 * during application startup; pass the resolver into anything that needs to
 * resolve service URLs.
 */
export function loadServiceUrlEnvironment(
  env: NodeJS.ProcessEnv = process.env
): ServiceUrlResolver {
  const basePublicApiUrl = env.BASE_PUBLIC_API_URL ?? ''
  if (basePublicApiUrl) {
    try {
      new URL(basePublicApiUrl)
    } catch (cause) {
      throw new Error(`BASE_PUBLIC_API_URL is not a valid URL: ${basePublicApiUrl}`, { cause })
    }
  }

  const publicUrlOverrides = collectPublicUrlOverrides(env)

  for (const [name, value] of Object.entries(publicUrlOverrides)) {
    try {
      new URL(value)
    } catch (cause) {
      throw new Error(`${name.toUpperCase()}${PUBLIC_URL_SUFFIX} is not a valid URL: ${value}`, { cause })
    }
  }

  const httpsRaw = (env.INTERNAL_HTTPS_FOR_SERVICES ?? '').trim()
  const internalHttpsList: InternalHttpsList = httpsRaw === '*'
    ? { all: true, names: new Set() }
    : {
        all: false,
        names: new Set(httpsRaw.split(',').map((s) => s.trim()).filter(Boolean))
      }

  const config: LoadedConfig = {
    basePublicApiUrl,
    publicUrlOverrides,
    usePublicApisInternally: env.USE_PUBLIC_APIS_INTERNALLY === 'true',
    internalApiNames: parseColonMap(env.INTERNAL_API_NAMES ?? DEFAULT_INTERNAL_API_NAMES),
    internalHttpsList
  }

  return {
    resolveServiceUrl(name, kind) {
      return kind === 'public' ? resolvePublic(name, config) : resolveInternal(name, config)
    },
    getPublicUrlOverrides() {
      return { ...config.publicUrlOverrides }
    },
    getBasePublicApiUrl() {
      return config.basePublicApiUrl
    }
  }
}

function collectPublicUrlOverrides(env: NodeJS.ProcessEnv): ServicePublicUrlOverrides {
  const overrides: ServicePublicUrlOverrides = {}

  for (const [key, value] of Object.entries(env)) {
    if (!value || !key.endsWith(PUBLIC_URL_SUFFIX)) {
      continue
    }
    const prefix = key.slice(0, -PUBLIC_URL_SUFFIX.length)
    if (!prefix) {
      continue
    }
    overrides[prefix.toLowerCase()] = value
  }

  return overrides
}

function parseColonMap(input: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of input.split(',')) {
    const [name, value] = entry.split(':').map((s) => s.trim())
    if (name && value) {
      map[name] = value
    }
  }
  return map
}

function resolvePublic(name: string, config: LoadedConfig): string {
  return resolveServicePublicUrl(name, config.basePublicApiUrl, config.publicUrlOverrides)
}

function resolveInternal(name: string, config: LoadedConfig): string {
  if (config.usePublicApisInternally) {
    return resolvePublic(name, config)
  }

  const host = config.internalApiNames[name] ?? `elephant-${name}`
  const useHttps = config.internalHttpsList.all || config.internalHttpsList.names.has(name)

  return useHttps
    ? `https://${host}:1443`
    : `http://${host}:1080`
}
