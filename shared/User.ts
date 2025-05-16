import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import type { RpcError } from '@protobuf-ts/runtime-rpc'
import type { PollMessagesResponse } from '@ttab/elephant-api/user'
import { MessagesClient } from '@ttab/elephant-api/user'
import type { TokenService } from './TokenService.js'
import { meta } from './meta.js'
import { AbortError } from './types/errors.js'

export class User {
  readonly #tokenService?: TokenService
  readonly #client: MessagesClient

  constructor(userUrl: string, tokenService?: TokenService) {
    this.#tokenService = tokenService
    this.#client = new MessagesClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', userUrl).toString(),
        sendJson: true
      })
    )
  }

  /**
   * Push a (system) message for an user
   *
   * @param {string} recipient - The recipient's user identifier (sub)
   * @param {Record<string, unknown>} context - Contextual information about the message
   * @param {string} context.docName - Name of the related document (optional)
   * @param {string} context.docUuid - UUID of the related document (optional)
   * @param {string} context.docType - Type of the document (optional)
   * @param {unknown} error - The error that occured for the recipient
   * @param {RpcError | false} rpcError - The rpc error that occured for the recipient, otherwise `false`
   *
   * @returns {Promise<void>}
   */
  async pushMessage(
    recipient: string, context: Record<string, unknown>,
    error: unknown, rpcError: RpcError | false
  ): Promise<void> {
    if (!recipient) {
      throw new Error('Recipient required')
    }

    if (!this.#tokenService) {
      throw new Error('Token service is required to push messages')
    }

    try {
      let type = 'error'
      const payload: Record<string, string> = {}

      if (error instanceof Error) {
        payload['err_name'] = error.name
        payload['err_message'] = error.message
        payload['err_stack'] = error.stack || ''
      }

      if (rpcError) {
        type = 'rpc_error'
        payload['rpc_code'] = rpcError.code
        payload['rpc_meta'] = rpcError.meta ? JSON.stringify(rpcError.meta) : ''
        payload['rpc_methodName'] = rpcError.methodName || ''
        payload['rpc_serviceName'] = rpcError.serviceName || ''
      }

      if (context.docName) {
        payload['documentName'] = context.docName as string
      }

      const accessToken = await this.#tokenService.getAccessToken()

      await this.#client.pushMessage({
        recipient,
        type,
        docUuid: context.docUuid as string,
        docType: context.docType as string,
        payload
      }, meta(accessToken))
    } catch (err: unknown) {
      throw new Error('Unable to push message', { cause: err })
    }
  }

  /**
   * Poll (system) messages for an user
   *
   * @param {string} afterId - The message id after which to poll for new messages,
   *                           set to -1 for the initial request.
   * @param {string} accessToken - The user's access token (recipient)
   *
   * @returns {Promise<void>}
   */
  async pollMessages(
    afterId: number, accessToken: string, abortSignal?: AbortSignal
  ): Promise<PollMessagesResponse> {
    if (!accessToken) {
      throw new Error('Access token required')
    }

    try {
      const { response } = await this.#client.pollMessages({
        afterId: BigInt(afterId)
      }, {
        ...meta(accessToken),
        abort: abortSignal
      })

      return response
    } catch (err: unknown) {
      if (abortSignal?.aborted) {
        throw new AbortError()
      }

      throw new Error('Unable to poll messages', { cause: err })
    }
  }
}
