import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { getContextFromValidSession, getSession, isContext } from '../../../lib/context.js'
import { snapshot } from '../../../utils/snapshot.js'

const SNAPSHOT_STRICT = process.env.SNAPSHOT_STRICT

export const POST: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const id = req.params.id
  const { status, cause, addToHistory } = req.query

  const yjsUpdate = (req.body instanceof Buffer && req.body.length === 0)
    ? undefined
    : req.body as Uint8Array | undefined

  if (SNAPSHOT_STRICT === 'true' && !yjsUpdate) {
    return {
      statusCode: 400,
      statusMessage: 'Yjs update is required in strict mode'
    }
  }

  const context = getContextFromValidSession(getSession(req, res))
  if (!isContext(context)) {
    return context
  }

  return snapshot(
    collaborationServer,
    id,
    { ...context, agent: 'server' },
    {
      status: typeof status === 'string' ? status : undefined,
      cause: typeof cause === 'string' ? cause : undefined,
      addToHistory: addToHistory === '1' ? true : false,
      yjsUpdate: yjsUpdate instanceof Uint8Array ? yjsUpdate : undefined
    }
  )
}
