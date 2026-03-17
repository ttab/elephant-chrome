import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { getContextFromValidSession, isContext } from '../../../lib/context.js'
import { getValueByYPath } from '../../../../shared/yUtils.js'
import type { EleBlock } from '@/shared/types/index.js'
import { isValidUUID } from '@/shared/isValidUUID.js'
import { snapshot } from '../../../utils/snapshot.js'
import logger from '../../../lib/logger.js'
import type * as Y from 'yjs'

/**
 * Remove an assignment (identified by its deliverable) from a planning item.
 * Used as a rollback when creating an article fails after the assignment was added.
 */
export const DELETE: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const planningId = req.params.id
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: unknown } | undefined

  const context = getContextFromValidSession(session)
  if (!isContext(context)) {
    return context
  }

  const { deliverableId, deliverableType } = req.body as {
    deliverableId?: string
    deliverableType?: string
  }

  if (!isValidUUID(planningId) || !deliverableId || !deliverableType) {
    return {
      statusCode: 400,
      statusMessage: 'Invalid input to removeassignment endpoint'
    }
  }

  const connection = await collaborationServer.server.openDirectConnection(planningId, context)

  await connection.transact((document) => {
    const yRoot = document.getMap('ele')
    const meta = yRoot.get('meta') as Y.Map<unknown>
    const yAssignments = meta?.get('core/assignment') as Y.Array<unknown>

    if (!yAssignments) {
      return
    }

    const [assignments] = getValueByYPath<EleBlock[]>(yRoot, 'meta.core/assignment')

    const index = assignments?.findIndex(
      (a) => a.links?.[deliverableType]?.[0]?.uuid === deliverableId
    ) ?? -1

    if (index !== -1) {
      yAssignments.delete(index, 1)
    } else {
      logger.warn(`removeassignment: no assignment found for deliverable ${deliverableId} in planning ${planningId}`)
    }
  })

  void connection.disconnect().catch((ex) => {
    logger.error(ex, 'Failed disconnecting after removeAssignment')
  })

  return snapshot(collaborationServer, planningId, context)
}
