import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import { useDocumentSnapshot } from '@/hooks/useDocumentSnapshot'

const BASE_URL = import.meta.env.BASE_URL || ''

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

const mockFetchOk = (document: unknown = { uuid: 'doc-1' }) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({ document })
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

describe('useDocumentSnapshot', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('fetches /api/documents/:id with no query when only id is given', async () => {
    const fetchMock = mockFetchOk()
    const { result } = renderHook(() => useDocumentSnapshot({ id: 'doc-1' }), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/documents/doc-1`)
  })

  it('serializes a bigint version into the query string', async () => {
    const fetchMock = mockFetchOk()
    renderHook(() => useDocumentSnapshot({ id: 'doc-1', version: 42n }), { wrapper })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/documents/doc-1?version=42`)
  })

  it('forwards version=0 (falsy bigint must not be dropped)', async () => {
    const fetchMock = mockFetchOk()
    renderHook(() => useDocumentSnapshot({ id: 'doc-1', version: 0n }), { wrapper })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/documents/doc-1?version=0`)
  })

  it('adds direct=true when direct is set', async () => {
    const fetchMock = mockFetchOk()
    renderHook(() => useDocumentSnapshot({ id: 'doc-1', direct: true }), { wrapper })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/documents/doc-1?direct=true`)
  })

  it('combines version and direct in the query string', async () => {
    const fetchMock = mockFetchOk()
    renderHook(() => useDocumentSnapshot({ id: 'doc-1', version: 7n, direct: true }), { wrapper })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/documents/doc-1?version=7&direct=true`)
  })

  it('does not fetch when enabled is false', async () => {
    const fetchMock = mockFetchOk()
    const { result } = renderHook(
      () => useDocumentSnapshot({ id: 'doc-1', enabled: false }),
      { wrapper }
    )
    await new Promise((r) => setTimeout(r, 20))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('does not fetch when id is undefined', async () => {
    const fetchMock = mockFetchOk()
    renderHook(() => useDocumentSnapshot({ id: undefined }), { wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces an error containing status and url on non-OK responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('document missing'),
      json: () => Promise.resolve({})
    })
    global.fetch = fetchMock as unknown as typeof fetch
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useDocumentSnapshot({ id: 'missing' }), { wrapper })
    await waitFor(() => expect(result.current.error).toBeDefined())
    const message = result.current.error?.message ?? ''
    expect(message).toContain('404')
    expect(message).toContain('Not Found')
    expect(message).toContain(`${BASE_URL}/api/documents/missing`)
    expect(message).toContain('document missing')
  })
})
