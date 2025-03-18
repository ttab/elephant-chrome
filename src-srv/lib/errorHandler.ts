import type { Hocuspocus, Extension, fetchPayload, storePayload, onStoreDocumentPayload, connectedPayload, onDisconnectPayload, onStatelessPayload } from '@hocuspocus/server'
import logger from './logger.js'
import { RpcError } from '@protobuf-ts/runtime-rpc'
import { isValidUUID } from '../utils/isValidUUID.js'
import { parseStateless, StatelessType } from '@/shared/stateless.js'
import type { User } from '@/shared/User.js'

/**
 * @property #server - An instance of Hocuspocus server. Need to be able to set a validation message in the document.
 * @property {User} #user - The user API instance used to push messages to the client.
 * @method constructor
 * @param {User} user - The user API instance used to push messages to the client.
 * @method handler - Handles the error
 * @method handleRpcError - differentiated handling for RPC errors based on their code.
 * @method handleRpcValidationError - Handles validation errors and sets a validation message in the document.
 * @method error
 */

class CollaborationServerErrorHandler {
  #server?: Hocuspocus
  #user: User

  constructor(user: User) {
    this.#user = user
  }

  setServer(server: Hocuspocus): void {
    this.#server = server
  }

  private handler(error: unknown, context?: Record<string, unknown>): void {
    try {
      const rpcError = isRpcError(error)
      if (rpcError && this.#server) {
        this.handleRpcError(rpcError, context)
      }

      if (context?.userSub) {
        void this.#user.pushMessage(context.userSub as string, context, error, rpcError)
          .catch((err: RpcError) => {
            logger.warn({ err, context }, 'Push message to the user API')
          })
      }
    } catch (err) {
      logger.error({ err, context }, 'Handle error after logging')
    }
  }

  /**
   * Offer differentiated handling RPC errors based on their code.
   *
   * @param {RpcError} error - The RPC error to handle.
   * @param {any} context - The context in which the error occurred.
   * @returns {string}
  */
  private handleRpcError(error: RpcError, context?: Record<string, unknown>): void {
    switch (error.code) {
      // Set a validation message in the document
      case 'invalid_argument':
        this.handleRpcValidationError(error, context)
        break
      case 'unauthenticated':
        // TODO: Reauth, not implemented
        break
      default:
        break
    }
  }

  private handleRpcValidationError(error: RpcError, context?: Record<string, unknown>): void {
    const { id, ...rest } = context || {}

    if (typeof id !== 'string' || typeof rest.accessToken !== 'string' || !this.#server) {
      logger.warn({ err: error, context }, 'Handle RPC validation error: Invalid context')
      return
    }

    // Create a direct connection to the current document and set a validation message
    this.#server.openDirectConnection(id, {
      ...rest,
      agent: 'server'
    })
      .then((connection) => {
        if (connection) {
          connection.transact((doc) => {
            const ele = doc.getMap('ele')
            ele.set('validation', {
              code: error.code,
              meta: error.meta,
              methodName: error.methodName,
              serviceName: error.serviceName
            })

            logger.debug('Validation error set in document')
          }).catch((err: unknown) => {
            logger.warn({ err, context }, 'Handle RPC validation error: Transact')
          })
        }
      }).catch((err: unknown) => {
        logger.warn({ err, context }, 'Handle RPC validation error: Open direct connection')
      })
  }

  fatal(error: unknown, context?: Record<string, unknown>): void {
    logger.fatal({ err: error, context })
    this.handler(error, context)
  }

  error(error: unknown, context?: Record<string, unknown>): void {
    logger.error({ err: error, context })
    this.handler(error, context)
  }

  warn(error: unknown, context?: Record<string, unknown>): void {
    logger.warn({ err: error, context })
    this.handler(error, context)
  }

  info(error: unknown, context?: Record<string, unknown>): void {
    logger.info({ err: error, context })
    this.handler(error, context)
  }

  debug(error: unknown, context?: Record<string, unknown>): void {
    logger.debug({ err: error, context })
    this.handler(error, context)
  }

  trace(error: unknown, context?: Record<string, unknown>): void {
    logger.trace({ err: error, context })
    this.handler(error, context)
  }
}

export default CollaborationServerErrorHandler

function isRpcError(error: unknown): RpcError | false {
  if (error instanceof RpcError) {
    return error
  }

  let err: unknown = error instanceof Error ? error.cause : null

  for (let i = 0; i < 50; i++) {
    if (!err) return false

    if (err instanceof RpcError) {
      return err
    }

    err = err instanceof Error ? err.cause : null
  }

  return false
}

export function withErrorHandler(extensions: Extension[], errorHandler: CollaborationServerErrorHandler): Extension[] {
  return extensions.map((extension) => new Proxy(extension, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver) as Extension
      if (typeof original === 'function') {
        return async (...args: unknown[]) => {
          try {
            return await (original as (...args: unknown[]) => unknown).apply(target, args)
          } catch (ex) {
            errorHandler?.error(ex)
          }
        }
      }
      return original
    }
  }))
}

type ErrorContext = {
  userSub?: string
  docName?: string
  docUuid?: string
  docType?: string
}

export function getErrorContext(
  payload: fetchPayload | storePayload | onStoreDocumentPayload
    | connectedPayload | onDisconnectPayload | onStatelessPayload
): ErrorContext {
  let userSub
  if ('context' in payload) {
    const context = payload.context as { user?: { sub?: string } }
    userSub = context?.user?.sub
  } else if (isOnStatelessPayload(payload)) {
    try {
      const msg = parseStateless(payload.payload)
      if (msg.type == StatelessType.IN_PROGRESS) {
        userSub = msg.message.context.user.sub
      }
    } catch (_err) {
      // Ignore errors, userSub remains undefined if not found
    }
  }

  const docName = payload.documentName

  let docUuid
  if (isValidUUID(payload.documentName)) {
    docUuid = payload.documentName
  }

  let docType
  if ('document' in payload && !payload.document.isEmpty('ele')) {
    const doc = payload.document.getMap('ele')
    docType = doc.get('type') as string
  }


  return {
    userSub,
    docName,
    docUuid,
    docType
  }
}

// Type guard function for onStatelessPayload
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOnStatelessPayload(payload: any): payload is onStatelessPayload {
  return 'payload' in payload && typeof payload.payload === 'string'
}
