import { validate as uuidValidate } from 'uuid'
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient } from '../protos/service.client.ts'
import { type JWTVerifyResult, jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { GetDocumentResponse, UpdateRequest, UpdateResponse } from '../protos/service.ts'
import { yDocToNewsDoc } from './transformations/yjs/index.ts'
import { type FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import { type Doc } from 'yjs'

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
  async getDoc({ uuid, accessToken }: { uuid: string, accessToken: string }): Promise<GetDocumentResponse> {
    if (uuidValidate(uuid)) {
      try {
        const { response } = await this.#client.get({
          uuid,
          version: 0n,
          status: '',
          lock: false
        }, meta(accessToken))
        return response
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Unable to fetch document: ${err.message}`)
        }
      }
    }
    throw new Error('Invalid uuid format')
  }

  /**
   * Save a newsdoc to repository
   * @param document Document
   * @param documentName string
   * @param accessToken string
   * @returns Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>
   */
  async saveDoc({ document, documentName, accessToken }: {
    document: Doc
    documentName: string
    accessToken: string
  }): Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>> {
    const newsDoc = yDocToNewsDoc(document)
    const payload = {
      ...newsDoc,
      meta: {},
      ifMatch: newsDoc.version,
      status: [],
      acl: [],
      uuid: documentName
    }

    const result = await this.#client.update(payload, meta(accessToken))

    // Success, update version
    if (result.status.code === 'OK') {
      document.getMap('original').set('version', result.response.version.toString())
    }

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
