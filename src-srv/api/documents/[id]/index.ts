import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '@/shared/isValidUUID.js'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import * as Y from 'yjs'
import logger from '../../../lib/logger.js'

import { type Context, isContext } from '../../../lib/context.js'
import { deleteByYPath, getValueByYPath, setValueByYPath } from '../../../../shared/yUtils.js'
import type { EleBlock } from '@/shared/types/index.js'
import { getSession } from '../../../lib/context.js'
import { snapshot } from '../../../utils/snapshot.js'

/**
 * Fetch a fresh document, either directly from Redis cache if it is there or from reposity if not,
 */
export const GET: RouteHandler = async (req: Request, { cache, repository, res }) => {
  const uuid = req.params.id
  const version = Number(req.query.version || '0')
  const type = req.query.type
  const direct = req.query.direct === 'true'

  const { accessToken } = getSession(req, res)


  if (!accessToken) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Access token not found, can not fetch document'
    }
  }

  if (!uuid || typeof uuid !== 'string' || !isValidUUID(uuid)) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request'
    }
  }

  try {
    // Fetch from Redis if exists and no version specified
    if (!version && !direct) {
      const state = await cache.get(uuid).catch((ex) => {
        throw new Error('get cached document', { cause: ex })
      })

      // Check for collaborative/cached document
      if (state) {
        const yDoc = new Y.Doc()
        Y.applyUpdate(yDoc, state)
        const documentResponse = fromYjsNewsDoc(yDoc)

        // Return newsdoc from cache
        if (type === 'newsdoc') {
          return {
            payload: {
              from: 'cache',
              version: documentResponse.version.toString(),
              document: fromGroupedNewsDoc(documentResponse).document
            }
          }
        }

        // Return grouped newsdoc from cache
        return {
          payload: {
            from: 'cache',
            version: documentResponse.version.toString(),
            document: documentResponse.document
          }
        }
      }
    }

    // Fetch content fron repository
    const doc = await repository.getDocument({
      uuid,
      accessToken,
      version
    }).catch((ex) => {
      throw new Error('get document from repository', { cause: ex })
    })

    if (!doc) {
      return {
        statusCode: 404,
        statusMessage: 'Not found'
      }
    }

    const documentResponse = toGroupedNewsDoc(doc)

    // Return newsdoc from repository
    if (type === 'newsdoc') {
      return {
        payload: {
          from: 'repository',
          version: documentResponse.version.toString(),
          document: fromGroupedNewsDoc(documentResponse).document
        }
      }
    }

    // Return grouped newsdoc from repository
    return {
      payload: {
        from: 'repository',
        version: documentResponse.version.toString(),
        document: documentResponse.document
      }
    }
  } catch (ex) {
    logger.error(ex)

    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}


/**
 * Patch method, make partial updates to a document.
 * Supported edits:
 * - Set publish time for withheld.
 * - Clear the stale publish time when leaving withheld (draft/usable).
 * - Set start time for draft
 */
export const PATCH: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const { accessToken, user } = getSession(req, res)

  if (!accessToken || !user) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not snapshot document'
    }
  }

  // Validate incoming data
  const { assignment } = req.body as {
    assignment: {
      deliverableId: string
      type: string
      status: string
      time: string
    }
  }

  const id = req.params.id
  const {
    deliverableId,
    type: deliverableType,
    status,
    time
  } = assignment || {}

  if (!id || !assignment || !deliverableId || !deliverableType || !status) {
    return {
      statusCode: 400,
      statusMessage: 'Invalid input to document PATCH method'
    }
  }

  // A publish time is only meaningful when scheduling. Clearing it (when leaving
  // withheld) needs no timestamp.
  if (status === 'withheld' && !time) {
    return {
      statusCode: 400,
      statusMessage: 'A publish time is required when scheduling a document'
    }
  }

  const context: Context = {
    accessToken,
    user,
    agent: 'server',
    units: []
  }

  if (!isContext(context)) {
    return {
      statusCode: 500,
      statusMessage: 'Invalid context provided'
    }
  }

  const connection = await collaborationServer.server.openDirectConnection(id, context)

  let foundAssignment: ReturnType<typeof getAssignment> = undefined

  // Make the change to the document in one transaction
  await connection.transact((document) => {
    const yRoot = document.getMap('ele')
    foundAssignment = getAssignment(yRoot, deliverableId, deliverableType)

    if (!foundAssignment) {
      return
    }

    const base = `meta.core/assignment[${foundAssignment.index}]`
    const [assignmentType] = getValueByYPath<string | undefined>(yRoot, `${base}.meta.core/assignment-type[0].value`)

    if (status === 'withheld') {
      // When scheduling we always set the publishTime to the given time
      setValueByYPath(yRoot, `${base}.data.publish`, time)
    } else {
      // Leaving the scheduled (withheld) state: the stored publish time is now
      // stale, so remove it entirely. structureAssignments falls back to the
      // status modified time / start time for display and sorting.
      deleteByYPath(yRoot, `${base}.data.publish`)

      if (time && assignmentType && ['text', 'flash', 'editorial-info'].includes(assignmentType)) {
        // If assignment type is text, flash or editorial info and the current start time is less
        // than the given time we bump the start time. The clear-only transitions
        // (e.g. leaving withheld for usable) send no time, so they skip this.
        const [currStartTime] = getValueByYPath<string | undefined>(yRoot, `${base}.data.start`)

        if (!currStartTime || (new Date(time) > new Date(currStartTime))) {
          setValueByYPath(yRoot, `${base}.data.start`, time)
        }
      }
    }
  })

  void connection.disconnect().catch((ex) => {
    logger.error(ex, 'Failed disconnecting after PATCH update')
  })

  // No assignment links this deliverable, so nothing was written. Fail loudly
  // instead of reporting success with no publish/start time stored.
  if (!foundAssignment) {
    return {
      statusCode: 404,
      statusMessage: 'No assignment found for the given deliverable, publish time was not updated'
    }
  }

  return snapshot(
    collaborationServer,
    id,
    context
  )
}


function getAssignment(yRoot: Y.Map<unknown>, deliverableId: string, deliverableType: string) {
  const [assignments] = getValueByYPath<EleBlock[]>(yRoot, 'meta.core/assignment')

  for (let i = 0; i < (assignments?.length || 0); i++) {
    if (assignments?.[i].links?.[deliverableType]?.[0].uuid === deliverableId) {
      return {
        assignmentId: assignments[i].id,
        index: i
      }
    }
  }

  return undefined
}
