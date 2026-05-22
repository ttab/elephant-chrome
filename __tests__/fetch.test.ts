import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'

vi.mock('@/hooks/index/useDocuments/lib/withArticleFactboxes', () => ({
  withArticleFactboxes: vi.fn()
}))

import { fetch } from '@/hooks/index/useDocuments/lib/fetch'
import { withArticleFactboxes as withArticleFactboxesMock } from '@/hooks/index/useDocuments/lib/withArticleFactboxes'

const session = { accessToken: 'tok' } as unknown as Session

const makeIndex = (queryImpl?: ReturnType<typeof vi.fn>) => {
  const query = queryImpl ?? vi.fn().mockResolvedValue({ ok: true, hits: [], subscriptions: [] })
  return { query } as unknown as Index & { query: ReturnType<typeof vi.fn> }
}

describe('fetch: withArticleFactboxes "only" mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips index.query when options.withArticleFactboxes === "only"', async () => {
    const index = makeIndex()
    const repository = {} as unknown as Repository
    vi.mocked(withArticleFactboxesMock).mockResolvedValue([
      { id: 'art:embedded:0', fields: {} } as unknown as HitV1
    ])

    const out = await fetch<HitV1, never>({
      index,
      session,
      repository,
      documentType: 'core/factbox',
      options: { withArticleFactboxes: 'only' }
    })

    expect(index.query).not.toHaveBeenCalled()
    expect(withArticleFactboxesMock).toHaveBeenCalledTimes(1)
    // The merge step starts from an empty standalone base.
    expect(vi.mocked(withArticleFactboxesMock).mock.calls[0][0].hits).toEqual([])
    expect(out).toEqual([{ id: 'art:embedded:0', fields: {} }])
  })

  it('runs both standalone index.query AND article merge when withArticleFactboxes === true', async () => {
    const standalone = { id: 'fb1', fields: {} } as unknown as HitV1
    const index = makeIndex(vi.fn().mockResolvedValue({ ok: true, hits: [standalone], subscriptions: [] }))
    const repository = {} as unknown as Repository
    vi.mocked(withArticleFactboxesMock).mockResolvedValue([standalone])

    await fetch<HitV1, never>({
      index,
      session,
      repository,
      documentType: 'core/factbox',
      options: { withArticleFactboxes: true }
    })

    expect(index.query).toHaveBeenCalledTimes(1)
    expect(withArticleFactboxesMock).toHaveBeenCalledTimes(1)
    expect(vi.mocked(withArticleFactboxesMock).mock.calls[0][0].hits).toEqual([standalone])
  })

  it('does not call the article merge at all when withArticleFactboxes is undefined', async () => {
    const index = makeIndex()
    const repository = {} as unknown as Repository

    await fetch<HitV1, never>({
      index,
      session,
      repository,
      documentType: 'core/article'
    })

    expect(index.query).toHaveBeenCalledTimes(1)
    expect(withArticleFactboxesMock).not.toHaveBeenCalled()
  })

  it('does not invoke setSubscriptions when standalone is skipped in "only" mode', async () => {
    // Without standalone hits there is no standalone subscription to register.
    const index = makeIndex()
    const repository = {} as unknown as Repository
    const setSubscriptions = vi.fn()
    vi.mocked(withArticleFactboxesMock).mockResolvedValue([])

    await fetch<HitV1, never>({
      index,
      session,
      repository,
      setSubscriptions,
      documentType: 'core/factbox',
      options: { withArticleFactboxes: 'only' }
    })

    expect(setSubscriptions).not.toHaveBeenCalled()
  })

  it('throws when index or accessToken is missing regardless of mode', async () => {
    await expect(
      fetch<HitV1, never>({
        index: undefined,
        session,
        documentType: 'core/factbox',
        options: { withArticleFactboxes: 'only' }
      })
    ).rejects.toThrow('Index or access token is missing')
  })
})
