import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Document } from '@ttab/elephant-api/newsdoc'
import { POST } from '../../src-srv/api/documents/[id]/convertToArticle'

const VALID_SOURCE_ID = '11111111-1111-1111-8111-111111111111'
const VALID_PLANNING_ID = '22222222-2222-2222-8222-222222222222'

function makeContext(overrides?: {
  sessionValid?: boolean
  sourceDoc?: Document | undefined
  sourcePlanningDoc?: Document | undefined
}) {
  const sessionValid = overrides?.sessionValid ?? true

  const getDocument = vi.fn().mockImplementation(
    ({ uuid }: { uuid: string }) => {
      if (uuid === VALID_SOURCE_ID) {
        return Promise.resolve({ document: overrides?.sourceDoc })
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
    bulkSaveMeta: vi.fn()
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

  const collaborationServer = {
    server: {
      openDirectConnection: vi.fn()
    }
  }

  return { repository, res, collaborationServer }
}

function makeRequest(params: {
  id: string
  body?: Record<string, unknown>
}) {
  return { params: { id: params.id }, body: params.body ?? {} }
}

describe('POST /api/documents/:id/convertToArticle — input validation', () => {
  beforeEach(() => vi.clearAllMocks())

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

  it('returns 404 when source document is not found', async () => {
    const ctx = makeContext({ sourceDoc: undefined })
    const req = makeRequest({ id: VALID_SOURCE_ID, body: { targetDate: '2026-05-15' } })

    const result = await POST(req as never, ctx as never)
    expect(result).toMatchObject({ statusCode: 404, statusMessage: /Source document/i })
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
    const timeless = Document.create({
      uuid: VALID_SOURCE_ID,
      type: 'core/article#timeless',
      uri: `core://article/${VALID_SOURCE_ID}`,
      language: 'sv-se'
    })
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
})
