import type { Hocuspocus } from '@hocuspocus/server'
import logger from './logger.js'
import type pino from 'pino'
import { RpcError } from '@protobuf-ts/runtime-rpc'

/**
 * @property #server - An instance of Hocuspocus server. Need to be able to set a validation message in the document.
 * @method constructor
 * @method handler - Handles the error
 * @method handleRpcError - differentiated handling for RPC errors based on their code.
 * @method handleRpcValidationError - Handles validation errors and sets a validation message in the document.
 * @method error
 */

class CollaborationServerErrorHandler {
  readonly #server: Hocuspocus

  constructor(server: Hocuspocus) {
    this.#server = server
  }

  private handler(error: unknown, logFn: (err?: unknown) => void, context?: Record<string, unknown>): void {
    try {
      const rpcError = isRpcError(error)
      if (rpcError) {
        this.handleRpcError(rpcError, logFn, context)
      }

      // Log everything
      logFn()
    } catch (err) {
      logFn(err)
    }
  }

  /**
   * Offer differentiated handling RPC errors based on their code.
   *
   * @param {RpcError} error - The RPC error to handle.
   * @param {pino.pino.LogFn} logFn - The log function to use for logging.
   * @param {any} context - The context in which the error occurred.
   * @returns {string}
  */
  private handleRpcError(error: RpcError, logFn: pino.LogFn, context?: Record<string, unknown>): void {
    switch (error.code) {
      // Set a validation message in the document
      case 'invalid_argument':
        this.handleRpcValidationError(error, logFn, context)
        break
      case 'unauthenticated':
        // TODO: Reauth, not implemented
        break
      default:
        break
    }
  }

  private handleRpcValidationError(error: RpcError, logFn: pino.LogFn, context?: Record<string, unknown>): void {
    const { id, ...rest } = context || {}

    if (typeof id !== 'string' || typeof rest.accessToken !== 'string') {
      throw new Error('Invalid context', { cause: error })
    }

    // Create a direct connection to the current document and set a validation message
    this.#server.openDirectConnection(id, {
      ...rest,
      agent: 'server'
    })
      .then(connection => {
        if (connection) {
          connection.transact(doc => {
            const ele = doc.getMap('ele')
            ele.set('validation', {
              code: error.code,
              meta: error.meta,
              methodName: error.methodName,
              serviceName: error.serviceName
            })

            logger.debug('Validation error set in document')
          }).catch((err) => {
            logFn(err)
          })
        }
      }).catch((err) => {
        logFn(err)
      })
  }

  fatal(error: unknown, context?: Record<string, unknown>): void {
    this.handler(error, (err: unknown) =>
      logger.fatal(err || error), context)
  }

  error(error: unknown, context?: Record<string, unknown>): void {
    this.handler(error, (err: unknown) => {
      logger.error(err || error)
    }, context)
  }

  warn(error: unknown, context?: Record<string, unknown>): void {
    this.handler(error, (err: unknown) =>
      logger.warn(err || error), context)
  }

  info(error: unknown, context?: Record<string, unknown>): void {
    this.handler(error, (err: unknown) =>
      logger.info(err || error), context)
  }

  debug(error: unknown, context?: Record<string, unknown>): void {
    this.handler(error, (err: unknown) =>
      logger.debug(err || error), context)
  }

  trace(error: unknown, context?: Record<string, unknown>): void {
    this.handler(error, (err: unknown) =>
      logger.trace(err || error), context)
  }
}

export default CollaborationServerErrorHandler

function isRpcError(error: unknown): RpcError | false {
  if (error instanceof RpcError) {
    return error
  }

  if (error instanceof Error && error.cause instanceof RpcError) {
    return error.cause
  }

  return false
}
