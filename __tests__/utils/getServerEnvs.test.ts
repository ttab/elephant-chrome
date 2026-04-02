import { vi } from 'vitest'
import { getServerEnvs } from '@/lib/getServerEnvs'

const validPayload = {
  indexUrl: 'https://index.example.com',
  webSocketUrl: 'https://ws.example.com',
  repositoryUrl: 'https://repo.example.com',
  contentApiUrl: 'https://content.example.com',
  spellcheckUrl: 'https://spell.example.com',
  userUrl: 'https://user.example.com',
  faroUrl: 'https://faro.example.com',
  baboonUrl: 'https://baboon.example.com',
  systemLanguage: 'nb-NO',
  environment: 'stage'
}

function mockFetch(payload: Record<string, string>, ok = true, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status,
    json: async () => Promise.resolve(payload)
  } as Response)
}

describe('getServerEnvs', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset()
  })

  it('returns urls and envs from a valid response', async () => {
    mockFetch(validPayload)

    const { urls, envs } = await getServerEnvs()

    expect(urls.indexUrl.href).toBe('https://index.example.com/')
    expect(urls.repositoryUrl.href).toBe('https://repo.example.com/')
    expect(urls.webSocketUrl.href).toBe('https://ws.example.com/')
    expect(urls.contentApiUrl.href).toBe('https://content.example.com/')
    expect(urls.spellcheckUrl.href).toBe('https://spell.example.com/')
    expect(urls.userUrl.href).toBe('https://user.example.com/')
    expect(urls.faroUrl.href).toBe('https://faro.example.com/')
    expect(urls.baboonUrl.href).toBe('https://baboon.example.com/')
    expect(envs.systemLanguage).toBe('nb-NO')
    expect(envs.environment).toBe('stage')
  })

  it('derives repositoryEventsUrl from repositoryUrl', async () => {
    mockFetch(validPayload)

    const { urls } = await getServerEnvs()

    expect(urls.repositoryEventsUrl.href).toBe('https://repo.example.com/sse')
  })

  it('throws on non-ok response', async () => {
    mockFetch(validPayload, false, 500)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs, got response 500')
  })

  it('throws when a required URL is missing', async () => {
    const { indexUrl: _, ...incomplete } = validPayload
    mockFetch(incomplete as Record<string, string>)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })

  it('throws when a required URL is empty', async () => {
    mockFetch({ ...validPayload, webSocketUrl: '' })

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })

  it('throws when systemLanguage is missing', async () => {
    const { systemLanguage: _, ...noLang } = validPayload
    mockFetch(noLang as Record<string, string>)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })

  it('throws when environment is missing', async () => {
    const { environment: _, ...noLang } = validPayload
    mockFetch(noLang as Record<string, string>)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })

  it('throws when a URL value is malformed', async () => {
    mockFetch({ ...validPayload, indexUrl: 'not-a-url' })

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })
})
