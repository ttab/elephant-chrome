import { fetchOrRefresh } from '../../src/datastore/lib/fetchOrRefresh'
import type { IndexedDBContextInterface } from '../../src/datastore/contexts/IndexedDBProvider'
import type { Index } from '../../shared/Index'
import type { HitV1 } from '@ttab/elephant-api/index'

function createMockHit(id: string, fields: Record<string, string[]>): HitV1 {
  const fieldValues: Record<string, { values: string[] }> = {}
  for (const [key, values] of Object.entries(fields)) {
    fieldValues[key] = { values }
  }

  return {
    id,
    score: 1,
    fields: fieldValues,
    source: {},
    sort: []
  } as HitV1
}

function createMockIDB(overrides?: Partial<IndexedDBContextInterface>): IndexedDBContextInterface {
  return {
    isConnected: true,
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    ...overrides
  } as unknown as IndexedDBContextInterface
}

function createMockIndex(hits: HitV1[] = []): Index {
  return {
    query: vi.fn().mockResolvedValue({
      ok: true,
      total: hits.length,
      page: 1,
      pages: 1,
      pageSize: 500,
      hits
    })
  } as unknown as Index
}

const transformer = (hit: HitV1) => ({
  id: hit.id,
  title: hit.fields['document.title']?.values?.[0] ?? ''
})

// Mock navigator.locks for jsdom
beforeEach(() => {
  Object.defineProperty(navigator, 'locks', {
    value: {
      request: vi.fn(async (_name: string, _opts: LockOptions, callback: (lock: Lock | null) => Promise<void>) => {
        await callback({ name: _name, mode: 'exclusive' } as Lock)
      })
    },
    writable: true,
    configurable: true
  })
})

describe('fetchOrRefresh', () => {
  it('fetches from index and stores in IDB on cache miss', async () => {
    const hits = [
      createMockHit('1', { 'document.title': ['Author A'] }),
      createMockHit('2', { 'document.title': ['Author B'] })
    ]
    const index = createMockIndex(hits)
    const IDB = createMockIDB({
      get: vi.fn()
        .mockResolvedValueOnce(undefined) // __meta check returns no lastRefresh
        .mockResolvedValueOnce([{ id: '1', title: 'Author A' }, { id: '2', title: 'Author B' }]) // final read
    })

    const result = await fetchOrRefresh(
      IDB,
      'core/author',
      index,
      'token-123',
      false,
      ['document.title'],
      transformer
    )

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(index.query).toHaveBeenCalledOnce()
    expect(vi.mocked(IDB.clear)).toHaveBeenCalledWith('core/author')
    expect(vi.mocked(IDB.put)).toHaveBeenCalledTimes(3) // 2 items + 1 meta
    expect(result).toEqual([
      { id: '1', title: 'Author A' },
      { id: '2', title: 'Author B' }
    ])
  })

  it('returns cached data without querying when cache is fresh', async () => {
    const cached = [{ id: '1', title: 'Cached' }]
    const index = createMockIndex()
    const IDB = createMockIDB({
      get: vi.fn()
        .mockResolvedValueOnce({ lastRefresh: new Date() }) // fresh cache
        .mockResolvedValueOnce(cached) // final read
    })

    const result = await fetchOrRefresh(
      IDB,
      'core/author',
      index,
      'token-123',
      false,
      ['document.title'],
      transformer
    )

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(index.query).not.toHaveBeenCalled()
    expect(result).toEqual(cached)
  })

  it('forces refresh even when cache is fresh', async () => {
    const hits = [createMockHit('1', { 'document.title': ['Fresh'] })]
    const index = createMockIndex(hits)
    const IDB = createMockIDB({
      get: vi.fn()
        .mockResolvedValueOnce({ lastRefresh: new Date() }) // fresh cache, but force=true
        .mockResolvedValueOnce([{ id: '1', title: 'Fresh' }])
    })

    await fetchOrRefresh(
      IDB,
      'core/author',
      index,
      'token-123',
      true,
      ['document.title'],
      transformer
    )

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(index.query).toHaveBeenCalledOnce()
  })

  it('returns empty array on query error without corrupting IDB', async () => {
    const index = {
      query: vi.fn().mockResolvedValue({
        ok: false,
        errorCode: -1,
        errorMessage: 'Server error',
        total: 0,
        page: 0,
        pageSize: 0,
        pages: 0,
        hits: []
      })
    } as unknown as Index

    const IDB = createMockIDB({
      get: vi.fn()
        .mockResolvedValueOnce(undefined) // no cache
        .mockResolvedValueOnce(undefined) // final read returns nothing
    })

    const result = await fetchOrRefresh(
      IDB,
      'core/author',
      index,
      'token-123',
      false,
      ['document.title'],
      transformer
    )

    expect(vi.mocked(IDB.clear)).not.toHaveBeenCalled()
    expect(vi.mocked(IDB.put)).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('skips fetch when lock is unavailable', async () => {
    Object.defineProperty(navigator, 'locks', {
      value: {
        request: vi.fn(async (_name: string, _opts: LockOptions, callback: (lock: Lock | null) => Promise<void>) => {
          await callback(null) // lock not available
        })
      },
      writable: true,
      configurable: true
    })

    const index = createMockIndex()
    const IDB = createMockIDB({
      get: vi.fn()
        .mockResolvedValueOnce(undefined) // no cache → triggers lock
        .mockResolvedValueOnce([{ id: '1', title: 'Existing' }]) // final read
    })

    const result = await fetchOrRefresh(
      IDB,
      'core/author',
      index,
      'token-123',
      false,
      ['document.title'],
      transformer
    )

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(index.query).not.toHaveBeenCalled()
    expect(result).toEqual([{ id: '1', title: 'Existing' }])
  })
})
