import type { Extension, Hocuspocus, onConfigurePayload, onDisconnectPayload, onLoadDocumentPayload, onStatelessPayload, onStoreDocumentPayload } from '@hocuspocus/server'
import * as Y from 'yjs'

import type { Repository as RepositoryWrapper } from '@/shared/Repository.js'
import { isValidUUID } from '../../utils/isValidUUID.js'
import { isContext } from '../../lib/context.js'
import type CollaborationServerErrorHandler from '../../lib/errorHandler.js'
import { getErrorContext } from '../../lib/errorHandler.js'
import { fromYjsNewsDoc, toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { type inProgressMessage, StatelessType, parseStateless } from '@/shared/stateless.js'
import type { EleDocumentResponse } from '@/shared/types/index.js'
import { createMultiDebounceWithMaxTime } from '../../utils/debounceStore.js'

interface RepisitoryExtensionConfiguration {
  repository: RepositoryWrapper
  errorHandler: CollaborationServerErrorHandler
  debounceInterval?: number
  maxDebounceTime?: number
}


export class RepositoryExtension implements Extension {
  readonly #repository: RepositoryWrapper
  readonly #errorHandler: CollaborationServerErrorHandler
  readonly #debounceInterval: number = 20000
  readonly #maxDebounceTime: number = 60000
  readonly #debouncedStore: {
    call: (key: string, payload: onStoreDocumentPayload) => void
    flush: (key: string, payload: onStoreDocumentPayload) => void
  }

  #hp?: Hocuspocus

  constructor(configuration: RepisitoryExtensionConfiguration) {
    this.#repository = configuration.repository
    this.#errorHandler = configuration.errorHandler

    this.#debounceInterval = configuration.debounceInterval ?? this.#debounceInterval
    this.#maxDebounceTime = configuration.maxDebounceTime ?? this.#maxDebounceTime

    // Create a multi-debounced store function
    this.#debouncedStore = createMultiDebounceWithMaxTime(
      (payload: onStoreDocumentPayload) => {
        this.#performDebouncedStore(payload).catch((ex) => {
          this.#errorHandler.error(ex, getErrorContext(payload))
        })
      },
      {
        debounceMs: this.#debounceInterval,
        maxDebounceMs: this.#maxDebounceTime
      }
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
      this.#errorHandler.error(
        ex,
        getErrorContext(payload)
      )
    }
  }

  async onStoreDocument(payload: onStoreDocumentPayload) {
    const { document, documentName } = payload

    if (!this.#shouldBeStored(document, documentName, payload.context)) {
      return
    }

    if (!isContext(payload.context)) {
      throw new Error(`Invalid context received in Repository.onStoreDocument for ${documentName}`)
    }

    this.#debouncedStore.call(documentName, payload)
    return Promise.resolve()
  }

  /**
   * When a client disconnects we flush any pending changes to the repository.
   */
  async onDisconnect(payload: onDisconnectPayload) {
    // Only flush documents that should be stored
    if (!this.#shouldBeStored(payload.document, payload.documentName, payload.context)) {
      return
    }

    if (!isContext(payload.context)) {
      throw new Error(`Invalid context received in Repository.onDisconnect for ${payload.documentName}`)
    }

    try {
      // Flush any pending debounced save for this document
      this.#debouncedStore.flush(
        payload.documentName,
        {
          ...payload,
          clientsCount: payload.clientsCount ?? 0
        }
      )

      console.info(`Flushed pending save for ${payload.documentName} on disconnect`)
    } catch (ex) {
      this.#errorHandler.error(
        ex,
        getErrorContext(payload)
      )
    }

    return Promise.resolve()
  }

  /**
   * Handles removal of __inProgress flags, storing the document as well as
   * adding the created(?) document to the users history/tracking document.
   */
  async onStateless(payload: onStatelessPayload) {
    if (!this.#hp) {
      throw new Error('Hocuspocus is not yet finished configuring')
    }

    const msg = parseStateless(payload.payload)

    // Only handle IN_PROGRESS and ignore state messages
    if (msg.type !== StatelessType.IN_PROGRESS || msg.message.state) {
      return
    }

    const connection = await this.#hp.openDirectConnection(msg.message.id, {
      ...msg.message.context,
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
    await this.#storeDocument(
      connection.document,
      documentResponse,
      msg.message.context.accessToken,
      updatedHash || originalHash,
      msg.message.status
    )

    // Finally update the user history document
    await this.#addDocumentToUserHistory(msg.message)

    // Cleanup
    await connection.disconnect()
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
    if (updatedHash) {
      await this.#storeDocument(
        document,
        documentResponse,
        payload.context.accessToken,
        updatedHash
      )
    }
  }

  /**
   * Store document in repository as well as update the hash and version in the Y.Doc
   */
  async #storeDocument(document: Y.Doc, documentResponse: EleDocumentResponse, accessToken: string, hash: number, status?: string) {
    const result = await this.#repository.saveDocument(
      fromGroupedNewsDoc(documentResponse).document,
      accessToken,
      status
    )

    if (result?.status.code !== 'OK') {
      throw new Error('Save snapshot document to repository failed', { cause: result })
    }

    console.info('=====> DOCUMENT STORED in REPOSITORY')

    // Update the document version and hash
    const versionMap = document.getMap('version')
    const hashMap = document.getMap('hash')
    versionMap.set('version', result?.response.version.toString())
    hashMap.set('hash', hash)
  }

  /**
   * Add a document to the user history tracking document.
   * Will create a user trackering document if non existing.
   */
  async #addDocumentToUserHistory(msg: inProgressMessage) {
    if (!this.#hp) {
      throw new Error('Hocuspocus is not yet finished configuring')
    }

    const { id, context } = msg
    const userId = context.user.sub.replace('core://user/', '')
    const connection = await this.#hp.openDirectConnection(userId, {
      ...context,
      agent: 'server'
    }).catch((ex) => {
      throw new Error('Failed acquire connection to HP server', { cause: ex })
    })

    await connection.transact((doc) => {
      const documents = doc.getMap('ele')
      const type = context.type

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
