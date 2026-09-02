import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BulkGetItem } from '@ttab/elephant-api/repository'

const mockBulkGet = vi.fn()

vi.mock('@protobuf-ts/twirp-transport', () => ({
  TwirpFetchTransport: vi.fn()
}))

vi.mock('@ttab/elephant-api/repository', () => ({
  DocumentsClient: class { bulkGet = mockBulkGet },
  MetricsClient: class {}
}))

import { Repository } from '@/shared/Repository'

const accessToken = 'tok'

function makeUuid(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`
}

function makeDocuments(count: number): { uuid: string, version?: bigint }[] {
  return Array.from({ length: count }, (_, i) => ({ uuid: makeUuid(i + 1) }))
}

function asItem({ uuid, version }: { uuid: string, version?: bigint }): BulkGetItem {
  return {
    uuid,
    version: version ?? 0n,
    subset: []
  }
}

type BulkGetCall = { documents: { uuid: string, version: bigint }[], subset: string[] }
type BulkGetMeta = { meta: { authorization: string }, abort?: AbortSignal }

function getCall(callIndex: number): BulkGetCall {
  const [request] = mockBulkGet.mock.calls[callIndex] as [BulkGetCall, BulkGetMeta]

  return request
}

function getMetaArg(callIndex: number): BulkGetMeta {
  const [, metaArg] = mockBulkGet.mock.calls[callIndex] as [BulkGetCall, BulkGetMeta]

  return metaArg
}

function getUuidsFromCall(callIndex: number): string[] {
  return getCall(callIndex).documents.map((document) => document.uuid)
}

describe('Repository.getDocuments batching', () => {
  let repo: Repository

  beforeEach(() => {
    mockBulkGet.mockReset()
    mockBulkGet.mockImplementation((request: BulkGetCall) => Promise.resolve({
      response: { items: request.documents.map(asItem) }
    }))

    repo = new Repository('http://localhost')
  })

  it('splits requests into batches of 200 documents and merges the items', async () => {
    const documents = makeDocuments(450)

    const result = await repo.getDocuments({ documents, accessToken })

    expect(mockBulkGet).toHaveBeenCalledTimes(3)
    expect(getUuidsFromCall(0)).toHaveLength(200)
    expect(getUuidsFromCall(1)).toHaveLength(200)
    expect(getUuidsFromCall(2)).toHaveLength(50)

    // Every document is requested exactly once, in order, across the batches
    expect([
      ...getUuidsFromCall(0),
      ...getUuidsFromCall(1),
      ...getUuidsFromCall(2)
    ]).toEqual(documents.map(({ uuid }) => uuid))

    expect(result?.items.map((item) => item.uuid)).toEqual(documents.map(({ uuid }) => uuid))
  })

  it('sends a single request when the document count is within the limit', async () => {
    const documents = makeDocuments(10)

    const result = await repo.getDocuments({ documents, accessToken })

    expect(mockBulkGet).toHaveBeenCalledTimes(1)
    expect(getUuidsFromCall(0)).toEqual(documents.map(({ uuid }) => uuid))
    expect(result?.items).toHaveLength(10)
  })

  it('sends exactly one request at the 200 document boundary', async () => {
    await repo.getDocuments({ documents: makeDocuments(200), accessToken })

    expect(mockBulkGet).toHaveBeenCalledTimes(1)
    expect(getUuidsFromCall(0)).toHaveLength(200)
  })

  it('drops documents pinned to version -1 before batching', async () => {
    const documents = [...makeDocuments(200), { uuid: makeUuid(201), version: -1n }]

    await repo.getDocuments({ documents, accessToken })

    expect(mockBulkGet).toHaveBeenCalledTimes(1)
    expect(getUuidsFromCall(0)).toHaveLength(200)
    expect(getUuidsFromCall(0)).not.toContain(makeUuid(201))
  })

  it('skips the request when every document is pinned to version -1', async () => {
    const result = await repo.getDocuments({
      documents: [{ uuid: makeUuid(1), version: -1n }],
      accessToken
    })

    expect(mockBulkGet).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [] })
  })

  it('passes the authorization, abort signal and subset to every batch', async () => {
    const abort = new AbortController().signal
    const subset = ['some.expression']

    await repo.getDocuments({ documents: makeDocuments(300), accessToken, abort, subset })

    expect(mockBulkGet).toHaveBeenCalledTimes(2)

    for (const callIndex of [0, 1]) {
      expect(getMetaArg(callIndex)).toEqual({
        meta: { authorization: `bearer ${accessToken}` },
        abort
      })
      expect(getCall(callIndex).subset).toEqual(subset)
    }
  })

  it('defaults the version of unversioned documents to 0', async () => {
    await repo.getDocuments({ documents: [{ uuid: makeUuid(1) }], accessToken })

    expect(getCall(0).documents).toEqual([{ uuid: makeUuid(1), version: 0n }])
  })

  it('returns null and skips the request when no documents are given', async () => {
    const result = await repo.getDocuments({ documents: [], accessToken })

    expect(mockBulkGet).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('returns null and skips the request when no uuid is valid', async () => {
    const result = await repo.getDocuments({ documents: [{ uuid: 'not-a-uuid' }], accessToken })

    expect(mockBulkGet).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('throws when one of the batches fails', async () => {
    mockBulkGet.mockImplementation((request: BulkGetCall) => {
      if (request.documents.some((document) => document.uuid === makeUuid(201))) {
        return Promise.reject(new Error('boom'))
      }

      return Promise.resolve({ response: { items: request.documents.map(asItem) } })
    })

    await expect(repo.getDocuments({ documents: makeDocuments(300), accessToken }))
      .rejects.toThrow('Unable to fetch documents in bulk: boom')
  })
})
