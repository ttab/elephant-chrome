import { expect, test, afterEach } from 'vitest'
import { MockApi } from './mockApi'

let mockApi: MockApi

afterEach(() => {
  mockApi?.restore()
})

test('intercepts fetch and returns mocked JSON response', async () => {
  mockApi = new MockApi()
  mockApi.mock('https://example.com/api/urls', {
    indexUrl: 'https://example.com/index'
  })
  mockApi.install()

  const response = await fetch('https://example.com/api/urls')
  const data: unknown = await response.json()

  expect(data).toEqual({ indexUrl: 'https://example.com/index' })
})

test('throws for unmocked URLs', async () => {
  mockApi = new MockApi()
  mockApi.install()

  await expect(fetch('https://unmocked.com/path'))
    .rejects.toThrow('MockApi: no mock for https://unmocked.com/path')
})

test('supports RegExp pattern matching on URL', async () => {
  mockApi = new MockApi()
  mockApi.mock(/\/api\/auth\/session/, {
    user: { name: 'Test User' },
    accessToken: 'token123'
  })
  mockApi.install()

  const response = await fetch('https://example.com/api/auth/session')
  const data = await response.json() as { user: { name: string } }

  expect(data.user.name).toBe('Test User')
})

test('supports string suffix matching', async () => {
  mockApi = new MockApi()
  mockApi.mock('/api/urls', { indexUrl: 'https://test.local' })
  mockApi.install()

  const response = await fetch('https://any-host.com/api/urls')
  const data = await response.json() as { indexUrl: string }

  expect(data.indexUrl).toBe('https://test.local')
})

test('reset clears all mocks', async () => {
  mockApi = new MockApi()
  mockApi.mock('https://example.com/foo', { bar: true })
  mockApi.reset()
  mockApi.install()

  await expect(fetch('https://example.com/foo')).rejects.toThrow()
})

test('supports custom status codes', async () => {
  mockApi = new MockApi()
  mockApi.mock('https://example.com/fail', { error: 'not found' }, 404)
  mockApi.install()

  const response = await fetch('https://example.com/fail')
  expect(response.status).toBe(404)
})

test('supports chaining mock calls', () => {
  mockApi = new MockApi()
  const result = mockApi
    .mock('https://a.com', { a: 1 })
    .mock('https://b.com', { b: 2 })

  expect(result).toBe(mockApi)
})
