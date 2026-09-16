import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { POST } from '../src-srv/api/documents/[id]/replaceDeliverable'
import type { Repository } from '@/shared/Repository'
import type { CollaborationServer } from '../src-srv/collaboration/CollaborationServer'

// Silence pino in the test output - we only assert the response shape.
vi.mock('../src-srv/lib/logger.js', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

const FROM_ID = '11111111-1111-4111-8111-111111111111'
const TO_ID = '22222222-2222-4222-8222-222222222222'

function makeRequest(overrides?: Partial<Request>): Request {
  return {
    params: { id: FROM_ID },
    body: { toArticleId: TO_ID, newAssignmentType: 'timeless' },
    headers: {},
    ...overrides
  } as unknown as Request
}

function makeResponse(): Response {
  return {
    locals: {
      session: {
        accessToken: 'test-token',
        user: { sub: 'user-1', name: 'Tester' }
      }
    }
  } as unknown as Response
}

describe('POST /api/documents/:id/replaceDeliverable - error path', () => {
  it('surfaces a non-200 status when getDeliverableInfo throws', async () => {
    const getDeliverableInfo = vi
      .fn()
      .mockRejectedValue(new Error('repository unavailable'))
    const repository = { getDeliverableInfo } as unknown as Repository
    const collaborationServer = {
      server: {
        openDirectConnection: vi.fn()
      }
    } as unknown as CollaborationServer
    const cache = {} as unknown as Parameters<typeof POST>[1]['cache']

    const result = await POST(makeRequest(), {
      repository,
      collaborationServer,
      cache,
      res: makeResponse()
    })

    expect(getDeliverableInfo).toHaveBeenCalledWith({
      uuid: FROM_ID,
      accessToken: 'test-token'
    })

    // Bug being fixed: handler currently returns 200 { updated: false } even
    // though the lookup failed, which lies to the client. We want a non-2xx
    // (5xx) so the client can surface or retry.
    const statusCode = 'statusCode' in result ? result.statusCode : undefined
    expect(statusCode).toBeDefined()
    expect(statusCode).not.toBe(200)
    expect(statusCode).toBeGreaterThanOrEqual(500)
  })

  it('still treats a successful empty getDeliverableInfo as a no-op success', async () => {
    const getDeliverableInfo = vi.fn().mockResolvedValue({ planningUuid: '' })
    const repository = { getDeliverableInfo } as unknown as Repository
    const collaborationServer = {
      server: {
        openDirectConnection: vi.fn()
      }
    } as unknown as CollaborationServer
    const cache = {} as unknown as Parameters<typeof POST>[1]['cache']

    const result = await POST(makeRequest(), {
      repository,
      collaborationServer,
      cache,
      res: makeResponse()
    })

    expect(result).toEqual({
      statusCode: 200,
      payload: { updated: false }
    })
  })
})
