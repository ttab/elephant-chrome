import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockBulkUpdate = vi.fn().mockResolvedValue({ response: {} })

vi.mock('@protobuf-ts/twirp-transport', () => ({
  TwirpFetchTransport: vi.fn()
}))

vi.mock('@ttab/elephant-api/repository', () => ({
  DocumentsClient: class { bulkUpdate = mockBulkUpdate },
  MetricsClient: class {}
}))

import { Repository } from '@/shared/Repository'

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${header}.${body}.`
}

const minimalDocument = {
  uuid: '00000000-0000-0000-0000-000000000001',
  type: 'core/article',
  uri: '',
  url: '',
  title: 'Test',
  content: [],
  meta: [],
  links: [],
  language: ''
}

const minimalPlanning = {
  uuid: '00000000-0000-0000-0000-000000000002',
  type: 'core/planning-item',
  uri: '',
  url: '',
  title: 'Test Planning',
  content: [],
  meta: [],
  links: [],
  language: ''
}

type Update = {
  uuid: string
  acl: Array<{ uri: string, permissions: string[] }>
}

function getUpdatesFromLastCall(): Update[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return mockBulkUpdate.mock.calls[0][0].updates as Update[]
}

describe('Repository.createDerivedDocument ACL', () => {
  let repo: Repository

  beforeEach(() => {
    mockBulkUpdate.mockClear()
    repo = new Repository('http://localhost')
  })

  it('sends redaktionen ACL for regular user', async () => {
    const token = makeJwt({ units: ['/redaktionen'] })
    await repo.createDerivedDocument({
      newDocument: minimalDocument as never,
      accessToken: token
    })

    const updates = getUpdatesFromLastCall()
    expect(updates).toHaveLength(1)
    expect(updates[0].acl).toEqual([
      { uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }
    ])
  })

  it('sends redaktionen-npk ACL for NPK user on both new document and new planning', async () => {
    const token = makeJwt({ units: ['/redaktionen-npk'] })
    await repo.createDerivedDocument({
      newDocument: minimalDocument as never,
      newPlanning: minimalPlanning as never,
      accessToken: token
    })

    const updates = getUpdatesFromLastCall()
    expect(updates).toHaveLength(2)
    expect(updates[0].acl).toEqual([
      { uri: 'core://unit/redaktionen-npk', permissions: ['r', 'w'] }
    ])
    expect(updates[1].acl).toEqual([
      { uri: 'core://unit/redaktionen-npk', permissions: ['r', 'w'] }
    ])
  })

  it('leaves the source status update with an empty ACL', async () => {
    const token = makeJwt({ units: ['/redaktionen-npk'] })
    await repo.createDerivedDocument({
      newDocument: minimalDocument as never,
      sourceStatusUpdate: {
        uuid: '00000000-0000-0000-0000-000000000003',
        name: 'used',
        version: 1n
      },
      accessToken: token
    })

    const updates = getUpdatesFromLastCall()
    expect(updates).toHaveLength(2)
    expect(updates[0].acl).toEqual([
      { uri: 'core://unit/redaktionen-npk', permissions: ['r', 'w'] }
    ])
    // status patch retains empty ACL
    expect(updates[1].acl).toEqual([])
  })
})
