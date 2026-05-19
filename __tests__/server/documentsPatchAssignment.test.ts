import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Y from 'yjs'
import type { Request, Response } from 'express'

vi.mock('../../src-srv/lib/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

import { PATCH } from '../../src-srv/api/documents/[id]/index.js'
import type { RouteContext } from '../../src-srv/routes.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { getValueByYPath } from '@/shared/yUtils.js'
import { planning } from '../data/planning-newsdoc.js'

const PLANNING_UUID = '00000000-0000-0000-0000-0000000000aa'
const EXISTING_DELIVERABLE = 'f283c9a0-6a2e-4021-a009-087961dd032f'
const UNKNOWN_DELIVERABLE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

function makePlanningYDoc(): Y.Doc {
  const yDoc = new Y.Doc()
  toYjsNewsDoc(toGroupedNewsDoc(planning), yDoc)
  return yDoc
}

function makeCollaborationServer(yDoc: Y.Doc, flushResult: { version: bigint } = { version: 2n }) {
  const transact = vi.fn().mockImplementation((cb: (doc: Y.Doc) => void) => {
    cb(yDoc)
    return Promise.resolve()
  })
  const disconnect = vi.fn().mockResolvedValue(undefined)
  const openDirectConnection = vi.fn().mockResolvedValue({ transact, disconnect })
  const flushDocument = vi.fn().mockResolvedValue(flushResult)

  return {
    collaborationServer: { server: { openDirectConnection }, flushDocument },
    transact,
    disconnect,
    flushDocument
  }
}

function makeReq(body: unknown): Request {
  return {
    params: { id: PLANNING_UUID },
    body
  } as unknown as Request
}

function makeRes(): Response {
  return {
    locals: {
      session: {
        accessToken: 'tok',
        user: { sub: 'user-1' }
      }
    }
  } as unknown as Response
}

function metaKeysContainingUndefined(yRoot: Y.Map<unknown>): string[] {
  const meta = yRoot.get('meta') as Y.Map<unknown> | undefined
  if (!meta) {
    return []
  }
  return Array.from(meta.keys()).filter((k) => k.includes('[undefined]'))
}

describe('PATCH /api/documents/:id assignment lookup', () => {
  let yDoc: Y.Doc

  beforeEach(() => {
    yDoc = makePlanningYDoc()
  })

  it('returns 400 when the assignment is not found on the document', async () => {
    const { collaborationServer, transact, disconnect, flushDocument } = makeCollaborationServer(yDoc)

    const yRoot = yDoc.getMap('ele')
    const [publishBefore] = getValueByYPath<string | undefined>(
      yRoot,
      'meta.core/assignment[0].data.publish'
    )

    const res = makeRes()
    const req = makeReq({
      assignment: {
        deliverableId: UNKNOWN_DELIVERABLE,
        type: 'core/article',
        status: 'withheld',
        time: '2030-12-31T10:30:00Z'
      }
    })

    const result = await PATCH(req, { collaborationServer, res } as unknown as RouteContext)

    expect(result).toEqual({ statusCode: 400, statusMessage: 'Assignment not found' })
    expect(transact).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(flushDocument).not.toHaveBeenCalled()

    // Guard against the regression: malformed YPath segments leaking into the doc.
    const [publishAfter] = getValueByYPath<string | undefined>(
      yRoot,
      'meta.core/assignment[0].data.publish'
    )
    expect(publishAfter).toBe(publishBefore)
    expect(metaKeysContainingUndefined(yRoot)).toEqual([])
  })

  it('updates publish time and snapshots when the assignment exists and status is withheld', async () => {
    const { collaborationServer, transact, disconnect, flushDocument } = makeCollaborationServer(yDoc)

    const yRoot = yDoc.getMap('ele')
    const newTime = '2030-12-31T10:30:00Z'

    const res = makeRes()
    const req = makeReq({
      assignment: {
        deliverableId: EXISTING_DELIVERABLE,
        type: 'core/article',
        status: 'withheld',
        time: newTime
      }
    })

    const result = await PATCH(req, { collaborationServer, res } as unknown as RouteContext)

    expect(result).toMatchObject({ statusCode: 200 })
    expect(transact).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(flushDocument).toHaveBeenCalledTimes(1)

    const [publishAfter] = getValueByYPath<string | undefined>(
      yRoot,
      'meta.core/assignment[0].data.publish'
    )
    expect(publishAfter).toBe(newTime)
  })
})
