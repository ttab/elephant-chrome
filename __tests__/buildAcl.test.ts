import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpdate = vi.fn().mockResolvedValue({ response: {} })

vi.mock('@protobuf-ts/twirp-transport', () => ({
  TwirpFetchTransport: vi.fn()
}))

vi.mock('@ttab/elephant-api/repository', () => ({
  DocumentsClient: class { update = mockUpdate },
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

function getAclFromLastCall(): Array<{ uri: string, permissions: string[] }> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return mockUpdate.mock.calls[0][0].acl as Array<{ uri: string, permissions: string[] }>
}

describe('Repository.saveDocument ACL', () => {
  let repo: Repository

  beforeEach(() => {
    mockUpdate.mockClear()
    repo = new Repository('http://localhost')
  })

  it('sends redaktionen ACL for regular user', async () => {
    const token = makeJwt({ units: ['/redaktionen'] })
    await repo.saveDocument(minimalDocument as never, token)

    expect(getAclFromLastCall()).toEqual([
      { uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }
    ])
  })

  it('sends redaktionen-npk ACL for NPK user', async () => {
    const token = makeJwt({ units: ['/redaktionen-npk'] })
    await repo.saveDocument(minimalDocument as never, token)

    expect(getAclFromLastCall()).toEqual([
      { uri: 'core://unit/redaktionen-npk', permissions: ['r', 'w'] }
    ])
  })

  it('sends redaktionen-npk ACL when user has multiple units including NPK', async () => {
    const token = makeJwt({
      units: ['/redaktionen', '/redaktionen-npk', '/other']
    })
    await repo.saveDocument(minimalDocument as never, token)

    expect(getAclFromLastCall()).toEqual([
      { uri: 'core://unit/redaktionen-npk', permissions: ['r', 'w'] }
    ])
  })

  it('falls back to redaktionen ACL when token has no units claim', async () => {
    const token = makeJwt({ sub: 'regular-user' })
    await repo.saveDocument(minimalDocument as never, token)

    expect(getAclFromLastCall()).toEqual([
      { uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }
    ])
  })

  it('falls back to redaktionen ACL for malformed token', async () => {
    await repo.saveDocument(minimalDocument as never, 'not-a-jwt')

    expect(getAclFromLastCall()).toEqual([
      { uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }
    ])
  })
})
