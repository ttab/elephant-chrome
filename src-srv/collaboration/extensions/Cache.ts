import type {
  Extension,
  onLoadDocumentPayload,
  onStoreDocumentPayload
} from '@hocuspocus/server'
import * as Y from 'yjs'
import { isContext } from '../../lib/context.js'
import type CollaborationServerErrorHandler from '../../lib/errorHandler.js'
import { getErrorContext } from '../../lib/errorHandler.js'
import type { RedisCache } from '../../utils/RedisCache.js'
import { isValidUUID } from '../../utils/isValidUUID.js'

interface CacheExtensionConfiguration {
  cache: RedisCache
  errorHandler: CollaborationServerErrorHandler

}

/**
 * CacheExtension to store and load document updates in the cache for faster retrieval.
 *
 * Contrary to the RepositoryExtension this stores and retrieves all documents,
 * repository documents and non persistent documents like tracker documents alike.
 */
export class CacheExtension implements Extension {
  readonly #cache: RedisCache
  readonly #errorHandler: CollaborationServerErrorHandler

  constructor(configuration: CacheExtensionConfiguration) {
    this.#cache = configuration.cache
    this.#errorHandler = configuration.errorHandler
  }

  async onLoadDocument(payload: onLoadDocumentPayload) {
    try {
      // Only require correct context for real uuid documents
      if ((isValidUUID(payload.documentName) && !isContext(payload.context))) {
        throw new Error(`Invalid context received in CacheExtension.onLoadDocument for ${payload.documentName}`)
      }

      const update = await this.#cache.get(payload.documentName)
      if (update) {
        Y.applyUpdate(payload.document, update)

        // Add flag to context
        if (isContext(payload.context)) {
          payload.context.loadedFromCache = true
        }
      }
    } catch (ex) {
      this.#errorHandler.error(
        ex,
        getErrorContext(payload)
      )
    }
  }

  async onStoreDocument({ documentName, document }: onStoreDocumentPayload) {
    await this.#cache.store(
      documentName,
      Buffer.from(Y.encodeStateAsUpdate(document))
    )
  }
}
