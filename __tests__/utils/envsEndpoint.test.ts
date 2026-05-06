import type { Request } from 'express'
import { GET } from '../../src-srv/api/envs/index'
import { loadServiceUrlEnvironment } from '../../src-srv/lib/serviceUrls'
import type { RouteContext } from '../../src-srv/routes'

const SERVICE_OVERRIDE_KEYS = [
  'INDEX_PUBLIC_URL',
  'REPOSITORY_PUBLIC_URL',
  'USER_PUBLIC_URL',
  'SPELL_PUBLIC_URL',
  'BABOON_PUBLIC_URL',
  'NTB_PUBLIC_URL',
  'IMAGE_SEARCH_PUBLIC_URL',
  'FARO_PUBLIC_URL'
]

function clearOverrides() {
  for (const key of SERVICE_OVERRIDE_KEYS) {
    delete process.env[key]
  }
}

function callGet() {
  const serviceUrls = loadServiceUrlEnvironment()
  const context = { serviceUrls } as unknown as RouteContext
  return GET({} as Request, context)
}

describe('GET /api/envs', () => {
  beforeEach(() => {
    clearOverrides()
  })

  it('returns base URL, sparse overrides and non-derivable URLs', async () => {
    process.env.BASE_PUBLIC_API_URL = 'https://api.example.com'
    process.env.WS_URL = 'https://ws.example.com'
    process.env.IMAGE_SEARCH_URL = 'https://imagesearch.example.com'
    process.env.IMAGE_SEARCH_PROVIDER = 'ntb'
    process.env.FARO_URL = 'https://faro.example.com'
    process.env.SYSTEM_LANGUAGE = 'nb-NO'
    process.env.HAS_PRINT = 'true'
    process.env.HAS_HAST = 'true'
    process.env.ENVIRONMENT = 'test'

    const result = await callGet() as { payload: Record<string, unknown> }

    expect(result.payload).toMatchObject({
      basePublicApiUrl: 'https://api.example.com',
      servicePublicUrlOverrides: {},
      webSocketUrl: 'https://ws.example.com',
      imageSearchUrl: 'https://imagesearch.example.com',
      imageSearchProvider: 'ntb',
      faroUrl: 'https://faro.example.com',
      systemLanguage: 'nb-NO',
      hasPrint: 'true',
      hasHast: 'true',
      hasLooseSlugline: '',
      environment: 'test'
    })
  })

  it('exposes any *_PUBLIC_URL env var as a sparse override', async () => {
    process.env.BASE_PUBLIC_API_URL = 'https://api.example.com'
    process.env.NTB_PUBLIC_URL = 'http://localhost:4380'
    process.env.REPOSITORY_PUBLIC_URL = 'https://repo-override.example.com'
    process.env.WS_URL = 'https://ws.example.com'
    process.env.IMAGE_SEARCH_URL = 'https://imagesearch.example.com'
    process.env.FARO_URL = 'https://faro.example.com'
    process.env.SYSTEM_LANGUAGE = 'sv-SE'

    const result = await callGet() as { payload: Record<string, unknown> }
    const overrides = result.payload.servicePublicUrlOverrides as Record<string, string>

    expect(overrides.ntb).toBe('http://localhost:4380')
    expect(overrides.repository).toBe('https://repo-override.example.com')
  })

  it('prefers IMAGE_SEARCH_PUBLIC_URL over IMAGE_SEARCH_URL for non-derivable fields', async () => {
    process.env.BASE_PUBLIC_API_URL = 'https://api.example.com'
    process.env.WS_URL = 'https://ws.example.com'
    process.env.IMAGE_SEARCH_URL = 'https://internal.example.com'
    process.env.IMAGE_SEARCH_PUBLIC_URL = 'https://public.example.com'
    process.env.FARO_URL = 'https://faro.example.com'
    process.env.SYSTEM_LANGUAGE = 'sv-SE'

    const result = await callGet() as { payload: Record<string, unknown> }

    expect(result.payload.imageSearchUrl).toBe('https://public.example.com')
  })

  it('returns empty strings when env vars are missing', async () => {
    delete process.env.BASE_PUBLIC_API_URL
    delete process.env.WS_URL
    delete process.env.IMAGE_SEARCH_URL
    delete process.env.IMAGE_SEARCH_PROVIDER
    delete process.env.FARO_URL
    delete process.env.SYSTEM_LANGUAGE

    const result = await callGet() as { payload: Record<string, unknown> }

    expect(result.payload.basePublicApiUrl).toBe('')
    expect(result.payload.webSocketUrl).toBe('')
    expect(result.payload.systemLanguage).toBe('')
  })
})
