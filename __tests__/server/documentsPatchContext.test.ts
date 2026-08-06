import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Y from 'yjs'
import type { Request, Response } from 'express'

vi.mock('../../src-srv/lib/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

import { PATCH } from '../../src-srv/api/documents/[id]/index.js'
import type { RouteContext } from '../../src-srv/routes.js'
import type { CollaborationServer } from '../../src-srv/collaboration/CollaborationServer.js'
import type { Context } from '../../src-srv/lib/context.js'
import type { Redis } from '../../src-srv/utils/Redis.js'
import type { Repository } from '@/shared/Repository.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { planning } from '../data/planning-newsdoc.js'

const PLANNING_UUID = '726045e7-a52b-4737-8fba-c8149f7e2c2d'
const EXISTING_DELIVERABLE = 'f283c9a0-6a2e-4021-a009-087961dd032f'

function makePlanningYDoc(): Y.Doc {
  const yDoc = new Y.Doc()
  toYjsNewsDoc(toGroupedNewsDoc(planning), yDoc)
  return yDoc
}

function makeHarness(yDoc: Y.Doc, sessionUnits: string[] | undefined) {
  const transact = vi.fn((cb: (doc: Y.Doc) => void) => {
    cb(yDoc)
    return Promise.resolve()
  })
  const disconnect = vi.fn(() => Promise.resolve())
  const openDirectConnection = vi.fn(
    (_id: string, _context: Context) => Promise.resolve({ transact, disconnect })
  )
  const flushDocument = vi.fn(() => Promise.resolve({ version: 2n }))

  const collaborationServer = {
    server: { openDirectConnection },
    flushDocument
  } as unknown as CollaborationServer
  const repository = {} as unknown as Repository
  const cache = {} as Redis
  const res = {
    locals: {
      session: {
        accessToken: 'tok',
        user: { name: 'Testy', sub: 'user-1' },
        ...(sessionUnits === undefined ? {} : { units: sessionUnits })
      }
    }
  } as unknown as Response

  const context: RouteContext = { collaborationServer, repository, cache, res }

  return { context, openDirectConnection, flushDocument }
}

function makeReq(): Request {
  return {
    params: { id: PLANNING_UUID },
    body: {
      assignment: {
        deliverableId: EXISTING_DELIVERABLE,
        type: 'core/article',
        status: 'withheld',
        time: '2030-12-31T10:30:00Z'
      }
    }
  } as unknown as Request
}

describe('PATCH /api/documents/:id context derivation', () => {
  let yDoc: Y.Doc

  beforeEach(() => {
    yDoc = makePlanningYDoc()
  })

  it('passes session.units through to the collaboration context', async () => {
    const units = ['unit-a', 'unit-b']
    const h = makeHarness(yDoc, units)

    const result = await PATCH(makeReq(), h.context)

    expect(result).toMatchObject({ statusCode: 200 })
    expect(h.openDirectConnection).toHaveBeenCalledTimes(1)
    const passedContext = h.openDirectConnection.mock.calls[0][1]
    expect(passedContext.units).toEqual(units)
    expect(passedContext.accessToken).toBe('tok')
    expect(passedContext.user).toMatchObject({ sub: 'user-1' })
    expect(passedContext.agent).toBe('server')
  })

  it('defaults context.units to [] when the session has no units', async () => {
    const h = makeHarness(yDoc, undefined)

    const result = await PATCH(makeReq(), h.context)

    expect(result).toMatchObject({ statusCode: 200 })
    expect(h.openDirectConnection).toHaveBeenCalledTimes(1)
    const passedContext = h.openDirectConnection.mock.calls[0][1]
    expect(passedContext.units).toEqual([])
  })
})
