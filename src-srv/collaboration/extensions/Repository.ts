import type {
  Extension,
  Hocuspocus,
  onConfigurePayload,
  onDisconnectPayload,
  onLoadDocumentPayload,
  onStatelessPayload,
  onStoreDocumentPayload
} from '@hocuspocus/server'
import * as Y from 'yjs'

import type { Repository as RepositoryWrapper } from '@/shared/Repository.js'
import { isValidUUID } from '../../utils/isValidUUID.js'
import type { Context } from '../../lib/context.js'
import { isContext } from '../../lib/context.js'
import type CollaborationServerErrorHandler from '../../lib/errorHandler.js'
import { getErrorContext } from '../../lib/errorHandler.js'
import { fromYjsNewsDoc, toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { StatelessType, parseStateless } from '@/shared/stateless.js'
import type { EleDocumentResponse } from '@/shared/types/index.js'
import { createDebounceMap } from '@/shared/leadingDebounce.js'
import type { RedisCache } from '../../utils/RedisCache.js'
import logger from '../../lib/logger.js'

interface RepisitoryExtensionConfiguration {
  repository: RepositoryWrapper
  errorHandler: CollaborationServerErrorHandler
  redis: RedisCache
  debounceInterval?: number
  maxDebounceTime?: number
}

export class RepositoryExtension implements Extension {
  readonly #repository: RepositoryWrapper
  readonly #errorHandler: CollaborationServerErrorHandler
  readonly #storeDebouncer: ReturnType<typeof createDebounceMap<onStoreDocumentPayload>>

  #hp?: Hocuspocus
  #redis: RedisCache

  constructor(configuration: RepisitoryExtensionConfiguration) {
    this.#repository = configuration.repository
    this.#errorHandler = configuration.errorHandler
    this.#redis = configuration.redis

    this.#storeDebouncer = createDebounceMap<onStoreDocumentPayload>(
      (documentName, payload) => {
        this.#performDebouncedStore(payload).catch ((ex) => {
          this.#errorHandler.error(ex, { documentName, context: 'debouncedStore' })
        })
      },
      configuration.debounceInterval ?? 15000,
      configuration.maxDebounceTime ?? 120000
    )
  }

  async onConfigure(payload: onConfigurePayload) {
    this.#hp = payload.instance

    // Hack to satisfy eslint into accepting inherited async
    return Promise.resolve()
  }

  async onLoadDocument(payload: onLoadDocumentPayload) {
    // We only handle real documents with uuid ids
    if (!isValidUUID(payload.documentName)) {
      return
    }

    try {
      if (!isContext(payload.context)) {
        throw new Error(`Invalid context received in RepositoryExtension.onLoadDocument for ${payload.documentName}`)
      }

      // If the document is already loaded from cache we're done
      if (payload.context.loadedFromCache === true) {
        return
      }

      const newsDoc = await this.#repository.getDocument({
        uuid: payload.documentName,
        accessToken: payload.context.accessToken
      })

      if (newsDoc) {
        toYjsNewsDoc(toGroupedNewsDoc(newsDoc), payload.document)
      }
    } catch (ex) {
      this.#errorHandler.error(ex, getErrorContext(payload))
    }
  }

  async onStoreDocument(payload: onStoreDocumentPayload) {
    const { document, documentName } = payload
    if (!this.#shouldBeStored(document, documentName, payload.context)) {
      return
    }

    if (!isContext(payload.context)) {
      throw new Error(`Invalid context in Repository.onStoreDocument for ${documentName}`)
    }

    if (payload.context.disconnected === true) {
      // Client disconnected from this document, immediately flush all pending changes to repo
      this.#storeDebouncer.flush(payload.documentName, payload)
    } else {
      this.#storeDebouncer.call(payload.documentName, payload)
    }

    return Promise.resolve()
  }

  async onDisconnect(payload: onDisconnectPayload) {
    if (isContext(payload.context)) {
      payload.context.disconnected = true
    }

    return Promise.resolve()
  }

  async onStateless(payload: onStatelessPayload) {
    if (!this.#hp) {
      throw new Error('Hocuspocus is not yet finished configuring')
    }

    const msg = parseStateless(payload.payload)

    // Only handle IN_PROGRESS and ignore state messages
    if (msg.type !== StatelessType.IN_PROGRESS) {
      return
    }

    return await this.flushDocument(
      msg.message.id,
      msg.message.context,
      {
        status: msg.message.status
      }
    )
  }

  /**
   * Handles flushing of unsaved document changes as well as adding
   * new/created(?) documents to the users history/tracking document.
   */
  async flushDocument(documentName: string, context: Context, options?: {
    status?: string
    cause?: string
    addToHistory?: boolean
  }): Promise<{
    version: string
  } | void> {
    if (!this.#hp) {
      throw new Error('Hocuspocus is not yet finished configuring')
    }

    // Only one server should handle a flush, aquire a lock or ignore
    const serverId = this.#hp.configuration.name || 'default'
    if (await this.#redis.aquireLock(`stateless:${documentName}`, serverId) !== true) {
      return
    }

    const { status = null, cause = null } = options || {}

    const connection = await this.#hp.openDirectConnection(documentName, {
      ...context,
      agent: 'server'
    }).catch((ex) => {
      throw new Error('Failed acquire connection to HP server', { cause: ex })
    })

    if (!connection.document) {
      await connection.disconnect()
      throw new Error('No document retrieved from connection')
    }

    await connection.transact((doc) => {
      const ele = doc.getMap('ele')
      const root = ele.get('root') as Y.Map<unknown>
      root?.delete('__inProgress')
    })

    const { documentResponse, updatedHash, originalHash } = fromYjsNewsDoc(connection.document)
    const result = await this.#storeDocument(
      documentName,
      connection.document,
      documentResponse,
      context.accessToken,
      updatedHash || originalHash,
      status,
      cause
    )

    // Cleanup
    await connection.disconnect()

    // Finally update the user history document if applicable
    if (options?.addToHistory === true) {
      await this.#addDocumentToUserHistory(documentName, context)
    }

    return result
  }

  /**
   * Performs the actual document storage (called by debounced function)
   */
  async #performDebouncedStore(payload: onStoreDocumentPayload) {
    const { document, documentName } = payload

    if (!isContext(payload.context)) {
      throw new Error(`Invalid context received in Repository.#performStore for ${documentName}`)
    }

    const { documentResponse, updatedHash } = fromYjsNewsDoc(document)
    if (!updatedHash) {
      return
    }

    return await this.#storeDocument(
      documentName,
      document,
      documentResponse,
      payload.context.accessToken,
      updatedHash
    )
  }

  /**
   * Store document in repository as well as update the hash and version in the Y.Doc
   */
  async #storeDocument(
    documentName: string,
    document: Y.Doc,
    documentResponse: EleDocumentResponse,
    accessToken: string,
    hash: number,
    status?: string | null,
    cause?: string | null
  ): Promise<{
      version: string
    }> {
    const result = await this.#repository.saveDocument(
      fromGroupedNewsDoc(documentResponse).document,
      accessToken,
      status ?? undefined,
      cause ?? undefined
    )

    if (result?.status.code !== 'OK') {
      throw new Error(`Failed storing document ${documentName} in repository`, { cause: result })
    }

    // Update the document version and hash
    const versionMap = document.getMap('version')
    const hashMap = document.getMap('hash')
    const version = result.response.version.toString()

    versionMap.set('version', version)
    hashMap.set('hash', hash)

    logger.info(`Document ${documentName} v${version} stored in repository`)

    return {
      version
    }
  }

  /**
   * Add a document to the user history tracking document.
   * Will create a user trackering document if non existing.
   */
  async #addDocumentToUserHistory(id: string, context: Context) {
    if (!this.#hp) {
      throw new Error('Hocuspocus is not yet finished configuring')
    }

    const type = context.type
    if (!type) {
      logger.warn(`Could not add document ${id} to user history, missing document type`)
      return
    }

    const userId = context.user.sub.replace('core://user/', '')
    const connection = await this.#hp.openDirectConnection(userId, {
      ...context,
      agent: 'server'
    }).catch((ex) => {
      throw new Error('Failed acquire connection to HP server', { cause: ex })
    })

    await connection.transact((doc) => {
      const documents = doc.getMap('ele')

      if (!documents.get(type)) {
        documents.set(type, new Y.Array())
      }

      const items = documents.get(type) as Y.Array<unknown>
      items.push([{
        id,
        timestamp: Date.now()
      }])
    }).catch((ex) => {
      throw new Error('error', { cause: ex })
    }).finally(() => {
      void connection.disconnect()
    })
  }

  /**
   * Validate whether we should save a document or not.
   */
  #shouldBeStored(document: Y.Doc, documentName: string, context: unknown) {
    if (!isValidUUID(documentName)) {
      return false
    }

    if (!isContext(context)) {
      throw new Error(`Invalid context received in Repository.shouldBeStored for ${documentName}`)
    }

    // Ignore server contexts
    if (context.agent === 'server') {
      return false
    }

    // Ignore user documents
    if (context.user.sub === documentName) {
      return false
    }

    // Ignore in progress documents as they can be invalid or incomplete
    if ((document.getMap('ele').get('root') as Y.Map<unknown>).get('__inProgress')) {
      return false
    }

    return true
  }
}
