import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import { POST } from '../../src-srv/api/documents/[id]/convertToArticle'
import { snapshot } from '../../src-srv/utils/snapshot'

interface PayloadResponse {
  statusCode: number
  payload: {
    articleId?: string
    planningId?: string
    warnings?: string[]
    error?: string
    message?: string
  }
}

vi.mock('../../src-srv/utils/snapshot', () => ({
  snapshot: vi.fn()
}))

const mockSnapshot = vi.mocked(snapshot)

const VALID_SOURCE_ID = '11111111-1111-1111-8111-111111111111'
const VALID_PLANNING_ID = '22222222-2222-2222-8222-222222222222'
const OTHER_ARTICLE_ID = '33333333-3333-3333-8333-333333333333'

function makeTimelessSource(): Document {
  return Document.create({
    uuid: VALID_SOURCE_ID,
    type: 'core/article#timeless',
    uri: `core://article/${VALID_SOURCE_ID}`,
    language: 'sv-se'
  })
}

function makePlanningReferencing(articleId: string): Document {
  return Document.create({
    uuid: VALID_PLANNING_ID,
    type: 'core/planning-item',
    uri: `core://newscoverage/${VALID_PLANNING_ID}`,
    meta: [
      Block.create({
        type: 'core/assignment',
        links: [
          Block.create({ type: 'core/article', uuid: articleId, rel: 'deliverable' })
        ]
      })
    ]
  })
}

function makeContext(overrides?: {
  sessionValid?: boolean
  sourceDoc?: Document | undefined
  sourcePlanningDoc?: Document | undefined
  openDirectConnection?: ReturnType<typeof vi.fn>
}) {
  const sessionValid = overrides?.sessionValid ?? true

  const getDocument = vi.fn().mockImplementation(
    ({ uuid }: { uuid: string }) => {
      if (uuid === VALID_SOURCE_ID) {
        return Promise.resolve({
          document: overrides?.sourceDoc,
          version: 1n
        })
      }
      if (uuid === VALID_PLANNING_ID) {
        return Promise.resolve({ document: overrides?.sourcePlanningDoc })
      }
      return Promise.resolve(undefined)
    }
  )

  const repository = {
    getDocument,
    pruneDocument: vi.fn(),
    bulkSaveMeta: vi.fn().mockResolvedValue(undefined)
  }

  const res = {
    locals: {
      session: sessionValid
        ? {
            accessToken: 'token',
            user: { sub: 'user-sub' }
          }
        : undefined
    }
  }

  const openDirectConnection = overrides?.openDirectConnection
    ?? vi.fn().mockResolvedValue({
      transact: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined)
    })

  const collaborationServer = {
    server: { openDirectConnection }
  }

  return { repository, res, collaborationServer }
}

function makeRequest(params: {
  id: string
  body?: Record<string, unknown>
}) {
  return { params: { id: params.id }, body: params.body ?? {} }
}

function primeHappyPath(ctx: ReturnType<typeof makeContext>, sourceDoc: Document): void {
  ctx.repository.pruneDocument.mockResolvedValue({
    document: Document.create({ ...sourceDoc, type: 'core/article' }),
    errors: []
  })
  mockSnapshot.mockResolvedValue({ statusCode: 200, payload: {} })
}

describe('POST /api/documents/:id/convertToArticle — input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSnapshot.mockReset()
  })

  it('returns 401 when session is missing', async () => {
    const ctx = makeContext({ sessionValid: false })
    const req = makeRequest({ id: VALID_SOURCE_ID, body: { targetDate: '2026-05-15' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 401 })
  })

  it('returns 400 for invalid source UUID', async () => {
    const ctx = makeContext()
    const req = makeRequest({ id: 'not-a-uuid', body: { targetDate: '2026-05-15' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 400, statusMessage: 'Invalid source document id' })
  })

  it('returns 400 when targetDate is missing', async () => {
    const ctx = makeContext()
    const req = makeRequest({ id: VALID_SOURCE_ID, body: {} })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 400, statusMessage: /targetDate/i })
  })

  it('returns 400 when targetDate has wrong format', async () => {
    const ctx = makeContext()
    const req = makeRequest({ id: VALID_SOURCE_ID, body: { targetDate: '2026/05/15' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 400, statusMessage: /targetDate/i })
  })

  it('returns 400 for impossible calendar dates', async () => {
    const ctx = makeContext()
    const req = makeRequest({ id: VALID_SOURCE_ID, body: { targetDate: '2026-13-45' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 400, statusMessage: /targetDate/i })
  })

  it('returns 400 for invalid sourcePlanningId', async () => {
    const ctx = makeContext()
    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: 'not-a-uuid' }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 400, statusMessage: /sourcePlanningId/i })
  })

  it('returns 500 when repository.getDocument rejects for the source', async () => {
    const ctx = makeContext()
    ctx.repository.getDocument.mockRejectedValue(new Error('repo down'))
    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({
      statusCode: 500,
      statusMessage: new RegExp(`fetch source document ${VALID_SOURCE_ID}`)
    })
  })

  it('returns 500 when repository.pruneDocument rejects', async () => {
    const timeless = makeTimelessSource()
    const ctx = makeContext({ sourceDoc: timeless })
    ctx.repository.pruneDocument.mockRejectedValue(new Error('prune boom'))
    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({
      statusCode: 500,
      statusMessage: new RegExp(`prune source document ${VALID_SOURCE_ID}`)
    })
    // Article was never opened for Yjs commit — no orphan.
    expect(ctx.collaborationServer.server.openDirectConnection).not.toHaveBeenCalled()
  })

  it('returns 500 when repository.getDocument rejects for the source planning', async () => {
    const timeless = makeTimelessSource()
    const ctx = makeContext({ sourceDoc: timeless })
    ctx.repository.pruneDocument.mockResolvedValue({
      document: Document.create({ ...timeless, type: 'core/article' }),
      errors: []
    })
    ctx.repository.getDocument.mockImplementation(
      ({ uuid }: { uuid: string }) => {
        if (uuid === VALID_SOURCE_ID) {
          return Promise.resolve({ document: timeless, version: 1n })
        }
        return Promise.reject(new Error('planning repo down'))
      }
    )
    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({
      statusCode: 500,
      statusMessage: new RegExp(`fetch source planning ${VALID_PLANNING_ID}`)
    })
    expect(ctx.collaborationServer.server.openDirectConnection).not.toHaveBeenCalled()
  })

  it('returns 404 when source document is not found', async () => {
    const ctx = makeContext({ sourceDoc: undefined })
    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 404, statusMessage: /Source document/i })
  })

  it('returns 400 when sourcePlanningId is missing', async () => {
    const ctx = makeContext()
    const req = makeRequest({ id: VALID_SOURCE_ID, body: { targetDate: '2026-05-15' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 400, statusMessage: /sourcePlanningId/i })
  })

  it('returns 400 when source document is not core/article#timeless', async () => {
    const nonTimeless = Document.create({
      uuid: VALID_SOURCE_ID,
      type: 'core/article',
      uri: `core://article/${VALID_SOURCE_ID}`,
      language: 'sv-se'
    })
    const ctx = makeContext({ sourceDoc: nonTimeless })
    const req = makeRequest({ id: VALID_SOURCE_ID, body: { targetDate: '2026-05-15' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({
      statusCode: 400,
      statusMessage: /core\/article#timeless/
    })
  })

  it('returns 404 when sourcePlanningId is given but planning is not found', async () => {
    const timeless = makeTimelessSource()
    const ctx = makeContext({ sourceDoc: timeless, sourcePlanningDoc: undefined })
    ctx.repository.pruneDocument.mockResolvedValue({
      document: Document.create({ ...timeless, type: 'core/article' }),
      errors: []
    })

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 404, statusMessage: /Source planning/i })
  })

  it('returns 400 when sourcePlanningId does not reference the source article', async () => {
    const timeless = makeTimelessSource()
    const unrelatedPlanning = makePlanningReferencing(OTHER_ARTICLE_ID)
    const ctx = makeContext({ sourceDoc: timeless, sourcePlanningDoc: unrelatedPlanning })
    ctx.repository.pruneDocument.mockResolvedValue({
      document: Document.create({ ...timeless, type: 'core/article' }),
      errors: []
    })

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({
      statusCode: 400,
      statusMessage: /does not reference the source article/i
    })
  })
})

describe('POST /api/documents/:id/convertToArticle — success & partial failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSnapshot.mockReset()
  })

  it('returns 200 with ids and empty warnings on happy path with sourcePlanningId', async () => {
    const timeless = makeTimelessSource()
    const planning = makePlanningReferencing(VALID_SOURCE_ID)
    const ctx = makeContext({ sourceDoc: timeless, sourcePlanningDoc: planning })
    primeHappyPath(ctx, timeless)

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never) as PayloadResponse
    expect(result.statusCode).toBe(200)
    expect(result.payload.warnings).toEqual([])
    expect(typeof result.payload.articleId).toBe('string')
    expect(typeof result.payload.planningId).toBe('string')
    expect(ctx.repository.bulkSaveMeta).toHaveBeenCalledWith(expect.objectContaining({
      statuses: [expect.objectContaining({ uuid: VALID_SOURCE_ID, name: 'used' })]
    }))
  })

  it('returns 200 with warnings when bulkSaveMeta fails', async () => {
    const timeless = makeTimelessSource()
    const planning = makePlanningReferencing(VALID_SOURCE_ID)
    const ctx = makeContext({ sourceDoc: timeless, sourcePlanningDoc: planning })
    primeHappyPath(ctx, timeless)
    ctx.repository.bulkSaveMeta.mockRejectedValue(new Error('boom'))

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({
      statusCode: 200,
      payload: { warnings: ['source-not-marked-used'] }
    })
  })

  it('surfaces articleId when planning openDirectConnection rejects after article commit', async () => {
    const timeless = makeTimelessSource()
    const planning = makePlanningReferencing(VALID_SOURCE_ID)

    const articleConn = {
      transact: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined)
    }
    const openDirectConnection = vi.fn()
      .mockResolvedValueOnce(articleConn)
      .mockRejectedValueOnce(new Error('ws down'))

    const ctx = makeContext({
      sourceDoc: timeless,
      sourcePlanningDoc: planning,
      openDirectConnection
    })
    ctx.repository.pruneDocument.mockResolvedValue({
      document: Document.create({ ...timeless, type: 'core/article' }),
      errors: []
    })
    // Only the article snapshot is reached before the failure.
    mockSnapshot.mockResolvedValueOnce({ statusCode: 200, payload: {} })

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never) as PayloadResponse
    expect(result.statusCode).toBe(500)
    expect(result.payload.error).toBe('planning-creation-failed')
    expect(result.payload.message).toBe('ws down')
    expect(typeof result.payload.articleId).toBe('string')
  })

  it('surfaces articleId when the article snapshot itself fails', async () => {
    const timeless = makeTimelessSource()
    const planning = makePlanningReferencing(VALID_SOURCE_ID)
    const ctx = makeContext({ sourceDoc: timeless, sourcePlanningDoc: planning })
    ctx.repository.pruneDocument.mockResolvedValue({
      document: Document.create({ ...timeless, type: 'core/article' }),
      errors: []
    })
    // Article snapshot fails before the planning branch is ever reached.
    mockSnapshot.mockResolvedValueOnce({
      statusCode: 500,
      statusMessage: 'article snapshot failed'
    })

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never) as PayloadResponse
    expect(result.statusCode).toBe(500)
    expect(result.payload.error).toBe('article-snapshot-failed')
    expect(result.payload.message).toBe('article snapshot failed')
    expect(typeof result.payload.articleId).toBe('string')
    // Planning branch must not have run, and the source must not be marked used.
    expect(mockSnapshot).toHaveBeenCalledTimes(1)
    expect(ctx.repository.bulkSaveMeta).not.toHaveBeenCalled()
  })

  it('surfaces articleId when planning snapshot returns a statusMessage', async () => {
    const timeless = makeTimelessSource()
    const planning = makePlanningReferencing(VALID_SOURCE_ID)
    const ctx = makeContext({ sourceDoc: timeless, sourcePlanningDoc: planning })
    ctx.repository.pruneDocument.mockResolvedValue({
      document: Document.create({ ...timeless, type: 'core/article' }),
      errors: []
    })
    mockSnapshot
      .mockResolvedValueOnce({ statusCode: 200, payload: {} })
      .mockResolvedValueOnce({ statusCode: 500, statusMessage: 'snapshot failed' })

    const req = makeRequest({
      id: VALID_SOURCE_ID,
      body: { targetDate: '2026-05-15', sourcePlanningId: VALID_PLANNING_ID }
    })

    const result = await POST(req as never, ctx as never) as PayloadResponse
    expect(result.statusCode).toBe(500)
    expect(result.payload.error).toBe('planning-creation-failed')
    expect(result.payload.message).toBe('snapshot failed')
    expect(typeof result.payload.articleId).toBe('string')
  })
})
