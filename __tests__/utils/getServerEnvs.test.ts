import { vi } from 'vitest'
import { getServerEnvs } from '@/lib/getServerEnvs'

const validPayload = {
  basePublicApiUrl: 'https://api.example.com',
  servicePublicUrlOverrides: {},
  webSocketUrl: 'https://ws.example.com',
  imageSearchUrl: 'https://content.example.com',
  faroUrl: 'https://faro.example.com',
  systemLanguage: 'nb-NO',
  environment: 'stage'
}

function mockFetch(payload: Record<string, unknown>, ok = true, status = 200) {
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

  it('returns non-derivable URLs and a working resolver', async () => {
    mockFetch(validPayload)

    const { urls, envs, resolveServiceUrl } = await getServerEnvs()

    expect(urls.webSocketUrl.href).toBe('https://ws.example.com/')
    expect(urls.imageSearchUrl.href).toBe('https://content.example.com/')
    expect(urls.faroUrl.href).toBe('https://faro.example.com/')
    expect(envs.systemLanguage).toBe('nb-NO')
    expect(envs.environment).toBe('stage')

    expect(resolveServiceUrl('repository').href).toBe('https://repository.api.example.com/')
    expect(resolveServiceUrl('index').href).toBe('https://index.api.example.com/')
    expect(resolveServiceUrl('ntb').href).toBe('https://ntb.api.example.com/')
  })

  it('honors servicePublicUrlOverrides per service', async () => {
    mockFetch({
      ...validPayload,
      servicePublicUrlOverrides: {
        ntb: 'http://localhost:4380',
        repository: 'https://repo-override.example.com'
      }
    })

    const { resolveServiceUrl } = await getServerEnvs()

    expect(resolveServiceUrl('ntb').href).toBe('http://localhost:4380/')
    expect(resolveServiceUrl('repository').href).toBe('https://repo-override.example.com/')
    expect(resolveServiceUrl('index').href).toBe('https://index.api.example.com/')
  })

  it('returns the same URL instance on repeated lookups', async () => {
    mockFetch(validPayload)

    const { resolveServiceUrl } = await getServerEnvs()

    expect(resolveServiceUrl('repository')).toBe(resolveServiceUrl('repository'))
  })

  it('throws on non-ok response', async () => {
    mockFetch(validPayload, false, 500)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs, got response 500')
  })

  it('throws when basePublicApiUrl is missing and no override fills the gap', async () => {
    const { basePublicApiUrl: _, ...incomplete } = validPayload
    mockFetch(incomplete)

    const { resolveServiceUrl } = await getServerEnvs()

    expect(() => resolveServiceUrl('repository')).toThrow(/basePublicApiUrl is required/)
  })

  it('throws when a non-derivable URL is empty', async () => {
    mockFetch({ ...validPayload, webSocketUrl: '' })

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })

  it('throws when systemLanguage is missing', async () => {
    const { systemLanguage: _, ...noLang } = validPayload
    mockFetch(noLang)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })

  it('throws when environment is missing', async () => {
    const { environment: _, ...noEnv } = validPayload
    mockFetch(noEnv)

    await expect(getServerEnvs()).rejects.toThrow('Failed fetching server envs')
  })
})
