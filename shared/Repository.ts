import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient, MetricsClient } from '@ttab/elephant-api/repository'
import type {
  BulkGetResponse,
  GetDocumentResponse,
  GetMetaResponse,
  GetStatusOverviewResponse,
  UpdateRequest,
  UpdateResponse,
  ValidateRequest,
  ValidateResponse,
  GetStatusHistoryReponse,
  GetMetricsResponse,
  AttachmentDetails,
  StatusUpdate
} from '@ttab/elephant-api/repository'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { RpcError, FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import type * as Y from 'yjs'
import { isValidUUID } from './isValidUUID.js'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { fromGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'

import { meta } from './meta.js'

export interface Status {
  name: string
  version: bigint
  uuid: string
  checkpoint?: string
  cause?: string
  type?: string
}

export class Repository {
  readonly #client: DocumentsClient
  readonly #metricsClient: MetricsClient

  constructor(repoUrl: string) {
    this.#client = new DocumentsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
      })
    )

    this.#metricsClient = new MetricsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
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
    if (!uuids.length) {
      console.warn('no uuids to fetch statuses from')
      return { items: [] }
    }

    if (uuids.filter(isValidUUID).length !== uuids.length) {
      console.warn('number of valid uuids did not match')
      return { items: [] }
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
  async getDocuments({ documents, accessToken }: {
    documents: { uuid: string, version?: bigint }[]
    accessToken: string
  }): Promise<BulkGetResponse | null> {
    if (!documents.length || !documents.filter((document) => isValidUUID(document.uuid)).length) {
      return null
    }

    try {
      const { response } = await this.#client.bulkGet({
        documents: documents.filter((doc) => doc?.version !== -1n).map((document) => {
          return ({ uuid: document.uuid, version: document.version || 0n })
        })
      }, meta(accessToken))

      return response
    } catch (err: unknown) {
      throw new Error(`Unable to fetch documents in bulk: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Get a document from the repository.
   *
   * @param options - { uuids: string[], accessToken: string }
   * @returns Promise<GetDocumentResponse>
   */
  async getDocument({ uuid, accessToken, version }: { uuid: string, accessToken: string, version?: number }): Promise<GetDocumentResponse | null> {
    if (!isValidUUID(uuid)) {
      throw new Error('Invalid uuid format')
    }

    try {
      const { response } = await this.#client.get({
        uuid,
        version: version ? BigInt(version) : 0n,
        status: '',
        lock: false,
        metaDocument: 1,
        metaDocumentVersion: 0n
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
   * Retrieves the meta information for the given UUID.
   *
   * @param {Object} params - The parameters for retrieving meta information.
   * @param {string} params.uuid - The UUID of the document.
   * @param {string} params.accessToken - The access token.
   * @returns {Promise<GetMetaResponse | null>} The meta information or null if not found.
   * @throws {Error} If the UUID format is invalid or unable to fetch meta information.
   */
  async getMeta({ uuid, accessToken }: { uuid: string, accessToken: string }): Promise<GetMetaResponse | null> {
    if (!isValidUUID(uuid)) {
      throw new Error('Invalid uuid format')
    }

    try {
      const { response } = await this.#client.getMeta({ uuid }, meta(accessToken))

      return response
    } catch (err) {
      if ((err as RpcError).code === 'not_found') {
        return null
      }

      throw new Error(`Unable to fetch documents meta: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Lists the document version history.
   *
   * @param {Object} params - The parameters for retrieving meta information.
   * @param {string} params.uuid - The UUID of the document.
   * @param {bigint} params.before - Which version number we should start fetching history from.
   * @param {string} params.accessToken - The access token.
   * @param {boolean} params.loadStatuses - Loads any statuses set on the document versions.
   * @returns {Promise<GetHistoryResponse | null>} The document history or null if not found.
   * @throws {Error} If the UUID format is invalid or unable to fetch the history.
   */
  async getStatusHistory({ uuid, accessToken }: { uuid: string, accessToken: string }): Promise<GetStatusHistoryReponse | null> {
    if (!isValidUUID(uuid)) {
      throw new Error('Invalid uuid format')
    }

    try {
      const { response } = await this.#client.getStatusHistory({ uuid, name: 'usable', before: 0n }, meta(accessToken))

      return response
    } catch (err) {
      throw new Error(`Unable to fetch document history: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Saves the meta information for the document.
   *
   * @param {Object} params - The parameters for saving meta information.
   * @param {Object} params.status - The status information.
   * @param {bigint} params.status.version - The version of the status.
   * @param {string} params.status.name - The name of the status.
   * @param {string} params.status.uuid - The UUID of the status.
   * @param {string} params.accessToken - The access token.
   * @param {string} params.currentStatus - The status information.
   * @returns {Promise<UpdateResponse>} The response from the update operation.
   * @throws {Error} If unable to save meta information.
   */
  async saveMeta({ status, accessToken, cause, isWorkflow = false, currentStatus }: {
    status: Status
    currentStatus?: Status
    accessToken: string
    cause?: string
    isWorkflow?: boolean
  }): Promise<UpdateResponse> {
    try {
      const { response } = await this.#client.update({
        uuid: status.uuid,
        status: (status.name === 'draft' && !isWorkflow)
          ? [
              { name: 'read', version: -1n, meta: {}, ifMatch: -1n },
              { name: 'saved', version: -1n, meta: {}, ifMatch: -1n },
              { name: 'used', version: -1n, meta: {}, ifMatch: -1n }
            ]
          : [{
              name: status.name,
              version: status.version,
              meta: cause ? { cause } : {},
              ifMatch: status.version
            }],
        meta: {},
        ifMatch: status.version < 0 ? currentStatus?.version ? currentStatus.version : status.version : status.version,
        acl: [],
        updateMetaDocument: false,
        lockToken: '',
        ifWorkflowState: '',
        ifStatusHeads: {},
        attachObjects: {},
        detachObjects: []
      }, meta(accessToken))

      return response
    } catch (err: unknown) {
      throw new Error(`Unable to save meta: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Save a newsdoc to repository
   *
   * @param yDoc Y.Doc
   * @param accessToken string
   * @returns Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>
   */
  async saveDocument(
    document: Document,
    accessToken: string,
    status?: string,
    cause?: string,
    attachObjects?: Record<string, string>
  ): Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse> | undefined> {
    const basicStatus: StatusUpdate[] = [{
      name: status || '',
      // Use the resulting version from the save
      version: 0n,
      meta: cause ? { cause } : {},
      // No optimistic lock
      ifMatch: 0n
    }]

    const payload: UpdateRequest = {
      document,
      meta: {},
      // No optimistic lock
      ifMatch: 0n,
      status: ([
        'core/article',
        'tt/print-article',
        'core/flash',
        'core/editorial-info'
      ].includes(document.type))
        ? status
          ? basicStatus
          : []
        : status && status !== 'draft'
          ? basicStatus
          : [],
      acl: [{ uri: 'core://unit/redaktionen', permissions: ['r', 'w'] }],
      uuid: document.uuid,
      lockToken: '',
      updateMetaDocument: false,
      ifWorkflowState: '',
      ifStatusHeads: {},
      attachObjects: attachObjects || {},
      detachObjects: []
    }

    return await this.#client.update(
      payload, meta(accessToken)
    )
  }

  async getMetrics(uuids: string[], kinds: string[], accessToken: string): Promise<GetMetricsResponse> {
    if (!uuids.length || uuids.filter(isValidUUID).length !== uuids.length) {
      throw new Error('Invalid uuid format in input')
    }

    try {
      const { response } = await this.#metricsClient.getMetrics({
        uuids,
        kinds
      }, meta(accessToken))

      return response
    } catch (err: unknown) {
      throw new Error(`Unable to fetch metrics: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
  * Validate a newsdoc without writing to repository
  * @param yDoc Y.Doc
  * @returns Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>>
  */
  async validateDoc(ydoc: Y.Doc): Promise<FinishedUnaryCall<ValidateRequest, ValidateResponse>> {
    const documentResponse = fromYjsNewsDoc(ydoc)

    return await this.#client.validate(
      fromGroupedNewsDoc(documentResponse)
    )
  }

  /**
   * Upload a file to the repository and file storage.
   */
  async uploadFile(name: string, contentType: string, file: File | Blob, accessToken: string): Promise<{
    uuid: string
    name: string
    contentType: string
    url: string
    uploadId: string
  }> {
    const { response } = await this.#client.createUpload({
      name,
      contentType,
      meta: {}
    }, meta(accessToken))

    const { id: uploadId, url } = response || {}

    if (!url || !uploadId) {
      throw new Error('CreateUpload request did not return a signed upload url')
    }

    try {
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType
        },
        mode: 'cors'
      })
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => 'Unknown error')
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${errorText}`)
      }

      const uuid = crypto.randomUUID()

      const document = Document.create({
        uuid,
        uri: `core://image/${uuid}`,
        language: process.env.VITE_SYSTEM_LANGUAGE || 'sv-se',
        title: name,
        type: 'core/image',
        meta: [
          Block.create({
            type: 'core/image',
            data: {
              filename: name,
              mimetype: contentType
            }
          })
        ]
      })

      // Pass attachObjects object as last parameter, together with image upload id
      await this.saveDocument(document, accessToken, undefined, undefined, { image: uploadId })

      return {
        uuid,
        name,
        contentType,
        url: uploadResponse.url,
        uploadId
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('CORS error: The S3 bucket is not configured to allow requests from this origin. Please configure CORS policy on the S3 bucket.')
        throw new Error('Upload failed due to CORS policy. Please contact your administrator to configure the S3 bucket CORS settings.')
      }
      console.error('Upload error:', error)
      throw error
    }
  }

  /**
   * Get a signed download url to an uploaded file.
   */
  async getAttachmentDetails(docId: string, accessToken: string): Promise<AttachmentDetails> {
    const { response } = await this.#client.getAttachments({
      documents: [docId],
      attachmentName: 'image',
      downloadLink: true
    }, meta(accessToken))

    const { attachments } = response || {}
    if (!Array.isArray(attachments) || !attachments.length) {
      throw new Error('Get attachments request did not return a signed download url')
    }

    return attachments[0]
  }
}
