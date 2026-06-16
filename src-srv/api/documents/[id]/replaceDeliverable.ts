import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import type * as Y from 'yjs'
import { isValidUUID } from '@/shared/isValidUUID.js'
import {
  getContextFromValidSession,
  isContext,
  type Context
} from '../../../lib/context.js'
import { snapshot } from '../../../utils/snapshot.js'
import logger from '../../../lib/logger.js'

type AssignmentType = 'text' | 'timeless'

interface ReplaceDeliverableBody {
  toArticleId?: string
  newAssignmentType?: AssignmentType
}

/**
 * Re-point the `rel='deliverable'` link on the planning that currently owns
 * `:id` as a deliverable so it points at `toArticleId` instead, and
 * optionally rewrite the assignment's `core/assignment-type` value
 * (e.g. 'text' → 'timeless' when converting the deliverable's type).
 *
 * Goes through Hocuspocus (`openDirectConnection` + `transact` + `snapshot`)
 * so any active Yjs sessions pick up the change rather than going stale
 * against a silent Repository write.
 */
export const POST: RouteHandler = async (
  req: Request,
  { collaborationServer, repository, res }
) => {
  const fromArticleId = req.params.id
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as {
    accessToken?: string
    user?: Context['user']
  } | undefined

  const context = getContextFromValidSession(session)
  if (!isContext(context)) {
    return context
  }
  const { accessToken } = context

  if (!isValidUUID(fromArticleId)) {
    return { statusCode: 400, statusMessage: 'Invalid article id' }
  }

  const { toArticleId, newAssignmentType } = (req.body ?? {}) as ReplaceDeliverableBody
  if (!toArticleId || !isValidUUID(toArticleId)) {
    return { statusCode: 400, statusMessage: 'toArticleId is required' }
  }

  const deliverableInfo = await repository.getDeliverableInfo({
    uuid: fromArticleId,
    accessToken
  }).catch((ex: unknown) => {
    logger.error(ex, `Failed fetching deliverable info for ${fromArticleId}`)
    return null
  })
  const planningId = deliverableInfo?.planningUuid
  if (!planningId) {
    // No owning planning — nothing to update. Treat as success.
    return { statusCode: 200, payload: { updated: false } }
  }

  try {
    const connection = await collaborationServer.server.openDirectConnection(
      planningId,
      context
    )
    await connection.transact((document) => {
      const meta = document.getMap('ele').get('meta') as Y.Map<unknown> | undefined
      const assignments = meta?.get('core/assignment') as Y.Array<Y.Map<unknown>> | undefined
      if (!assignments) {
        return
      }

      assignments.forEach((assignment) => {
        const links = assignment.get('links') as Y.Map<unknown> | undefined
        const deliverables = links?.get('core/article') as Y.Array<Y.Map<unknown>> | undefined
        if (!deliverables) {
          return
        }

        let matched = false
        deliverables.forEach((link) => {
          if (link.get('rel') === 'deliverable' && link.get('uuid') === fromArticleId) {
            link.set('uuid', toArticleId)
            matched = true
          }
        })

        if (matched && newAssignmentType) {
          const assignmentMeta = assignment.get('meta') as Y.Map<unknown> | undefined
          const typeBlocks = assignmentMeta?.get('core/assignment-type') as Y.Array<Y.Map<unknown>> | undefined
          typeBlocks?.forEach((block) => {
            block.set('value', newAssignmentType)
          })

          // Keep data.public consistent with the new type: timeless
          // assignments are not part of the planning's published artifact.
          const data = assignment.get('data') as Y.Map<unknown> | undefined
          data?.set('public', newAssignmentType === 'timeless' ? 'false' : 'true')
        }
      })
    })
    void connection.disconnect().catch((ex: unknown) => {
      logger.error(ex, `Failed disconnecting after replaceDeliverable on ${planningId}`)
    })

    const snapshotResult = await snapshot(
      collaborationServer,
      planningId,
      context,
      { addToHistory: false }
    )
    if ('statusMessage' in snapshotResult) {
      logger.error(
        { planningId, statusMessage: snapshotResult.statusMessage },
        'replaceDeliverable snapshot failed'
      )
      return snapshotResult
    }

    return { statusCode: 200, payload: { updated: true, planningId } }
  } catch (ex: unknown) {
    logger.error(ex, `replaceDeliverable failed for article ${fromArticleId} → planning ${planningId}`)
    return {
      statusCode: 500,
      statusMessage: ex instanceof Error ? ex.message : 'Unknown error'
    }
  }
}
