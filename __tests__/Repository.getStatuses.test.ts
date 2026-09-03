import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StatusOverviewItem } from '@ttab/elephant-api/repository'

const mockGetStatusOverview = vi.fn()

vi.mock('@protobuf-ts/twirp-transport', () => ({
  TwirpFetchTransport: vi.fn()
}))

vi.mock('@ttab/elephant-api/repository', () => ({
  DocumentsClient: class { getStatusOverview = mockGetStatusOverview },
  MetricsClient: class {}
}))

import { Repository } from '@/shared/Repository'
import { meta } from '@/shared/meta'

const statuses = ['usable', 'draft']
const accessToken = 'tok'

function makeUuid(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`
}

function makeUuids(count: number): string[] {
  return Array.from({ length: count }, (_, i) => makeUuid(i + 1))
}

function asItem(uuid: string): StatusOverviewItem {
  return {
    uuid,
    version: 1n,
    modified: '',
    heads: {},
    workflowState: 'draft',
    workflowCheckpoint: '',
    creatorUri: '',
    updaterUri: ''
  }
}

type OverviewCall = { statuses: string[], uuids: string[], getMeta: boolean }
type OverviewCallArgs = [OverviewCall, ReturnType<typeof meta>]

function getCall(callIndex: number): OverviewCallArgs {
  return mockGetStatusOverview.mock.calls[callIndex] as OverviewCallArgs
}

function getUuidsFromCall(callIndex: number): string[] {
  return getCall(callIndex)[0].uuids
}

describe('Repository.getStatuses batching', () => {
  let repo: Repository

  beforeEach(() => {
    mockGetStatusOverview.mockReset()
    mockGetStatusOverview.mockImplementation((request: OverviewCall) => Promise.resolve({
      response: { items: request.uuids.map(asItem) }
    }))

    repo = new Repository('http://localhost')
  })

  it('splits requests into batches of 200 uuids and merges the items', async () => {
    const uuids = makeUuids(450)

    const result = await repo.getStatuses({ uuids, statuses, accessToken })

    expect(mockGetStatusOverview).toHaveBeenCalledTimes(3)
    expect(getUuidsFromCall(0)).toHaveLength(200)
    expect(getUuidsFromCall(1)).toHaveLength(200)
    expect(getUuidsFromCall(2)).toHaveLength(50)

    // Every uuid is requested exactly once, in order, across the batches
    expect([
      ...getUuidsFromCall(0),
      ...getUuidsFromCall(1),
      ...getUuidsFromCall(2)
    ]).toEqual(uuids)

    expect(result?.items.map((item) => item.uuid)).toEqual(uuids)
  })

  it('sends the access token and the unbatched request fields with every batch', async () => {
    await repo.getStatuses({ uuids: makeUuids(450), statuses, accessToken })

    expect(mockGetStatusOverview).toHaveBeenCalledTimes(3)

    // Only `uuids` differs between batches - the auth meta and the remaining
    // request fields have to be repeated on each one.
    for (const [request, options] of [getCall(0), getCall(1), getCall(2)]) {
      expect(options).toEqual(meta(accessToken))
      expect(request.statuses).toEqual(statuses)
      expect(request.getMeta).toBe(false)
    }
  })

  it('sends a single request when the uuid count is within the limit', async () => {
    const uuids = makeUuids(10)

    const result = await repo.getStatuses({ uuids, statuses, accessToken })

    expect(mockGetStatusOverview).toHaveBeenCalledTimes(1)
    expect(getUuidsFromCall(0)).toEqual(uuids)
    expect(result?.items).toHaveLength(10)
  })

  it('sends exactly one request at the 200 uuid boundary', async () => {
    await repo.getStatuses({ uuids: makeUuids(200), statuses, accessToken })

    expect(mockGetStatusOverview).toHaveBeenCalledTimes(1)
    expect(getUuidsFromCall(0)).toHaveLength(200)
  })

  it('deduplicates uuids before batching', async () => {
    const uuids = [makeUuid(1), makeUuid(2), makeUuid(1), makeUuid(2), makeUuid(3)]

    await repo.getStatuses({ uuids, statuses, accessToken })

    expect(mockGetStatusOverview).toHaveBeenCalledTimes(1)
    expect(getUuidsFromCall(0)).toEqual([makeUuid(1), makeUuid(2), makeUuid(3)])
  })

  it('returns no items and skips the request when no uuids are given', async () => {
    const result = await repo.getStatuses({ uuids: [], statuses, accessToken })

    expect(mockGetStatusOverview).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [] })
  })

  it('returns no items and skips the request when a uuid is invalid', async () => {
    const result = await repo.getStatuses({
      uuids: [makeUuid(1), 'not-a-uuid'],
      statuses,
      accessToken
    })

    expect(mockGetStatusOverview).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [] })
  })

  it('throws when one of the batches fails', async () => {
    mockGetStatusOverview.mockImplementation((request: OverviewCall) => {
      if (request.uuids.includes(makeUuid(201))) {
        return Promise.reject(new Error('boom'))
      }

      return Promise.resolve({ response: { items: request.uuids.map(asItem) } })
    })

    await expect(repo.getStatuses({ uuids: makeUuids(300), statuses, accessToken }))
      .rejects.toThrow('Unable to fetch statuses: boom')
  })
})
