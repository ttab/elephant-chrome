import { GET } from '../../src-srv/api/envs/index'

describe('GET /api/envs', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns all URLs and systemLanguage from env vars', async () => {
    process.env.INDEX_URL = 'https://index.example.com'
    process.env.WS_URL = 'https://ws.example.com'
    process.env.REPOSITORY_URL = 'https://repo.example.com'
    process.env.USER_URL = 'https://user.example.com'
    process.env.CONTENT_API_URL = 'https://content.example.com'
    process.env.SPELLCHECK_URL = 'https://spell.example.com'
    process.env.FARO_URL = 'https://faro.example.com'
    process.env.BABOON_URL = 'https://baboon.example.com'
    process.env.SYSTEM_LANGUAGE = 'nb-NO'

    const result = await GET() as { payload: Record<string, string> }

    expect(result.payload).toEqual({
      indexUrl: 'https://index.example.com',
      webSocketUrl: 'https://ws.example.com',
      repositoryUrl: 'https://repo.example.com',
      userUrl: 'https://user.example.com',
      contentApiUrl: 'https://content.example.com',
      spellcheckUrl: 'https://spell.example.com',
      faroUrl: 'https://faro.example.com',
      baboonUrl: 'https://baboon.example.com',
      systemLanguage: 'nb-NO'
    })
  })

  it('prefers PUBLIC_URL variants over base URL vars', async () => {
    process.env.INDEX_URL = 'https://internal.example.com'
    process.env.INDEX_PUBLIC_URL = 'https://public.example.com'
    process.env.WS_URL = 'https://ws.example.com'
    process.env.REPOSITORY_URL = 'https://repo.example.com'
    process.env.REPOSITORY_PUBLIC_URL = 'https://repo-public.example.com'
    process.env.USER_URL = 'https://user.example.com'
    process.env.CONTENT_API_URL = 'https://content.example.com'
    process.env.SPELLCHECK_URL = 'https://spell.example.com'
    process.env.FARO_URL = 'https://faro.example.com'
    process.env.BABOON_URL = 'https://baboon.example.com'
    process.env.SYSTEM_LANGUAGE = 'sv-SE'

    const result = await GET() as { payload: Record<string, string> }

    expect(result.payload.indexUrl).toBe('https://public.example.com')
    expect(result.payload.repositoryUrl).toBe('https://repo-public.example.com')
  })

  it('returns empty strings when env vars are missing', async () => {
    // Clear all relevant env vars
    delete process.env.INDEX_URL
    delete process.env.INDEX_PUBLIC_URL
    delete process.env.WS_URL
    delete process.env.SYSTEM_LANGUAGE

    const result = await GET() as { payload: Record<string, string> }

    expect(result.payload.indexUrl).toBe('')
    expect(result.payload.webSocketUrl).toBe('')
    expect(result.payload.systemLanguage).toBe('')
  })
})
