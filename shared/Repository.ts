import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient } from '@/protos/service.client.js'
import type { Document, GetDocumentResponse, UpdateRequest, UpdateResponse, ValidateRequest, ValidateResponse } from '@/protos/service.js'
import { type FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import type * as Y from 'yjs'
import { yDocToNewsDoc } from '../src-srv/utils/transformations/yjs/yDoc.js'

export interface Session {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
}

function validateUUID(uuid: string): boolean {
  // https://github.com/uuidjs/uuid/blob/main/src/regex.js
  const UUIDRegEx = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
  return UUIDRegEx.test(uuid)
}

export class Repository {
  readonly #client: DocumentsClient

  constructor(repoUrl: string) {
    this.#client = new DocumentsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString()
      })
    )
  }

  /**
   * Get a newsdoc from repository
   * @param uuid string
   * @param accessToken string
   * @returns Promise<GetDocumentResponse>
   */
  async getDoc({ uuid, accessToken }: { uuid: string, accessToken: string }): Promise<GetDocumentResponse | null> {
    if (!validateUUID(uuid)) {
      throw new Error('Invalid uuid format')
    }

    try {
      const { response } = await this.#client.get({
        uuid,
        version: 0n,
        status: '',
        lock: false
      }, meta(accessToken))

      return response
    } catch (err: unknown) {
      if ((err as { code: string })?.code === 'not_found') {
        return null
      }

      throw new Error(`Unable to fetch document: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Save a newsdoc to repository
   * @param yDoc Y.Doc
   * @param accessToken string
   * @returns Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>
   */
  async saveDoc(document: Document, accessToken: string, version: bigint):
  Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse> | undefined> {
    const payload: UpdateRequest = {
      document,
      meta: {},
      ifMatch: version,
      status: [],
      acl: [{ uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }],
      uuid: document.uuid
    }

    return await this.#client.update(
      payload, meta(accessToken)
    )
  }

  /**
  * Validate a newsdoc without writing to repository
  * @param yDoc Y.Doc
  * @returns Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>>
  */
  async validateDoc(ydoc: Y.Doc):
  Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>> {
    const { document, version } = await yDocToNewsDoc(ydoc)
    const payload = {
      version: BigInt(version),
      document
    }

    return await this.#client.validate(payload)
  }
}

/**
 * Helper function to create meta auth obj
 */
function meta(token: string): { meta: { authorization: string } } {
  return {
    meta: {
      authorization: `bearer ${token}`
    }
  }
}
