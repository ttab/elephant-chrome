import { validate as uuidValidate } from 'uuid'
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient } from '../protos/service.client.js'
import { type JWTVerifyResult, jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { GetDocumentResponse, UpdateRequest, UpdateResponse, ValidateRequest, ValidateResponse } from '../protos/service.js'
import { type FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import type * as Y from 'yjs'
import { yMapToNewsDoc } from './transformations/yjs/yMap.js'

export interface GetAuth {
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
    if (!uuidValidate(uuid)) {
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

  async saveDoc(ydoc: Y.Doc, accessToken: string): Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>> {
    const document = yMapToNewsDoc(ydoc.getMap('ele'))

    const versionMap = ydoc.getMap('version')
    const version = BigInt(versionMap.get('version') as string)

    const payload: UpdateRequest = {
      document,
      meta: {},
      ifMatch: version,
      status: [],
      acl: [],
      uuid: document.uuid
    }

    const result = await this.#client.update(payload, meta(accessToken))

    // Success, update version
    if (result.status.code === 'OK') {
      versionMap.set('version', result.response.version.toString())
      console.debug('Snapshot saved:', document.uuid, 'version:', result.response.version.toString())
    }
    return result
  }

  async validateDoc(ele: Y.Map<unknown>, version: string):
  Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>> {
    const document = yMapToNewsDoc(ele)
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
