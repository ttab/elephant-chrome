import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient } from '@/protos/service.client.js'
import { type JWTVerifyResult, jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { Document, GetDocumentResponse, UpdateRequest, UpdateResponse, ValidateRequest, ValidateResponse } from '@/protos/service.js'
import { type FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import type * as Y from 'yjs'
import { yDocToNewsDoc } from './transformations/yjs/yDoc.js'

interface GetAuth {
  user: string
  password: string
  sub: string
  permissions: string
}

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
  readonly #repoUrl: string
  readonly #jwks: JWTVerifyGetKey
  readonly #client: DocumentsClient

  constructor(repoUrl: string, jwks: JWTVerifyGetKey) {
    this.#repoUrl = repoUrl
    this.#jwks = jwks
    this.#client = new DocumentsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString()
      })
    )
  }

  /**
   * Authenticate with repo
   */
  async auth({ user, password, sub, permissions }: GetAuth): Promise<Session> {
    try {
      const res = await fetch(
        new URL('/token', this.#repoUrl),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `grant_type=password&username=${user} <user://tt/${sub}, core://unit/redaktionen>&password=${password}&scope=${permissions}`
        }
      )

      if (res.status === 200) {
        return await res.json()
      }

      throw new Error('Unable to authorize')
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message)
      }

      throw new Error('Unknown error')
    }
  }

  /**
   * Validate access token
   * @param jwt string
   * @returns Promise<JWTVerifyResult>
   */
  async validateToken(jwt: string): Promise<JWTVerifyResult> {
    const result = await jwtVerify(jwt, this.#jwks).catch(err => {
      throw new Error('Failed to verify jwt', { cause: err })
    })

    return result
  }

  async refresh({ refreshToken }: { refreshToken: string }): Promise<Session> {
    try {
      const res = await fetch(new URL('/token', this.#repoUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`
      })

      if (res.status === 200) {
        return await res.json()
      }

      throw new Error('Unable to authorize')
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message)
      }

      throw new Error('Unknown error')
    }
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

    const result = await this.#client.update(payload, meta(accessToken))

    return result
  }

  /**
  * Validate a newsdoc without writing to repository
  * @param yDoc Y.Doc
  * @returns Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>>
  */
  async validateDoc(ydoc: Y.Doc):
  Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>> {
    const { document, version } = yDocToNewsDoc(ydoc)
    const payload = {
      version: BigInt(version),
      document
    }
    const result = await this.#client.validate(payload)
    return result
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
