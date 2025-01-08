import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient } from '@ttab/elephant-api/repository'
import type {
  BulkGetResponse,
  GetDocumentResponse,
  GetStatusOverviewResponse,
  UpdateRequest,
  UpdateResponse,
  ValidateRequest,
  ValidateResponse
} from '@ttab/elephant-api/repository'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { type FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import type * as Y from 'yjs'
import { isValidUUID } from '../src-srv/utils/isValidUUID.js'
import { fromYjsNewsDoc } from '../src-srv/utils/transformations/yjsNewsDoc.js'
import { fromGroupedNewsDoc } from '../src-srv/utils/transformations/groupedNewsDoc.js'
import { meta } from './meta.js'

export interface Session {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
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
   * Get the status documents for the given array of uuids from the respository.
   *
   * @param options - { uuids: string[], statuses: string[], accessToken: string }
   * @returns Promise<GetStatusOverviewResponse | null>
   */
  async getStatuses({ uuids, statuses, accessToken }: {
    uuids: string[]
    statuses: string[]
    accessToken: string
  }): Promise<GetStatusOverviewResponse | null> {
    if (!uuids.length || uuids.filter(isValidUUID).length !== uuids.length) {
      throw new Error('Invalid uuid format in input')
    }

    try {
      const { response } = await this.#client.getStatusOverview({
        statuses,
        uuids,
        getMeta: false
      }, meta(accessToken))

      return response
    } catch (err: unknown) {
      throw new Error(`Unable to fetch statuses: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Get the latest version of the documents specified by the given
   * array of uuids from the respository.
   *
   * @param options - { uuids: string[], accessToken: string }
   * @returns Promise<BulkGetResponse | null>
   */
  async getDocuments({ uuids, accessToken }: {
    uuids: string[]
    accessToken: string
  }): Promise<BulkGetResponse | null> {
    if (!uuids.length || uuids.filter(isValidUUID).length !== uuids.length) {
      throw new Error('Invalid uuid format in input')
    }

    try {
      const { response } = await this.#client.bulkGet({
        documents: uuids.map((uuid) => { return { uuid, version: BigInt(0) } })
      }, meta(accessToken))

      return response
    } catch (err: unknown) {
      throw new Error(`Unable to fetch documents in bulk: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Get a document from the repository.
   *
   * @todo Rename to getDocument()
   *
   * @param options - { uuids: string[], accessToken: string }
   * @returns Promise<GetDocumentResponse>
   */
  async getDoc({ uuid, accessToken }: { uuid: string, accessToken: string }): Promise<GetDocumentResponse | null> {
    if (!isValidUUID(uuid)) {
      throw new Error('Invalid uuid format')
    }

    try {
      const { response } = await this.#client.get({
        uuid,
        version: 0n,
        status: '',
        lock: false,
        metaDocument: 1
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
   *
   * @param yDoc Y.Doc
   * @param accessToken string
   * @returns Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>
   */
  async saveDoc(document: Document, accessToken: string, version: bigint): Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse> | undefined> {
    const payload: UpdateRequest = {
      document,
      meta: {},
      ifMatch: version,
      status: [],
      acl: [{ uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }],
      uuid: document.uuid,
      lockToken: '',
      updateMetaDocument: false
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
  async validateDoc(ydoc: Y.Doc): Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>> {
    const { documentResponse } = await fromYjsNewsDoc(ydoc)

    return await this.#client.validate(
      await fromGroupedNewsDoc(documentResponse)
    )
  }
}
