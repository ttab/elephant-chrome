type MockResponse = Record<string, unknown> | unknown[]
type UrlMatcher = string | RegExp

interface MockEntry {
  matcher: UrlMatcher
  response: MockResponse
  status?: number
}

export class MockApi {
  private mocks: MockEntry[] = []
  private originalFetch: typeof globalThis.fetch | null = null

  mock(matcher: UrlMatcher, response: MockResponse, status = 200): this {
    this.mocks.push({ matcher, response, status })
    return this
  }

  install(): void {
    this.originalFetch = globalThis.fetch
    globalThis.fetch = (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url

      const entry = this.mocks.find((m) => {
        if (typeof m.matcher === 'string') {
          return url === m.matcher || url.endsWith(m.matcher)
        }
        return m.matcher.test(url)
      })

      if (!entry) {
        return Promise.reject(new Error(`MockApi: no mock for ${url}`))
      }

      return Promise.resolve(new Response(JSON.stringify(entry.response), {
        status: entry.status ?? 200,
        headers: { 'Content-Type': 'application/json' }
      }))
    }
  }

  reset(): void {
    this.mocks = []
  }

  restore(): void {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch
      this.originalFetch = null
    }
    this.mocks = []
  }
}
