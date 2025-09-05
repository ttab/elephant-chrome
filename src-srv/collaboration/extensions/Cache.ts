import type {
  Extension,
  onLoadDocumentPayload,
  onStoreDocumentPayload
} from '@hocuspocus/server'
import * as Y from 'yjs'
import { isContext } from '../../lib/context.js'
import type CollaborationServerErrorHandler from '../../lib/errorHandler.js'
import { getErrorContext } from '../../lib/errorHandler.js'
import type { Redis } from '../../utils/Redis.js'
import { isValidUUID } from '../../utils/isValidUUID.js'

interface CacheExtensionConfiguration {
  redis: Redis
  errorHandler: CollaborationServerErrorHandler

}

/**
 * CacheExtension to store and load document updates in the cache.
 *
 * Contrary to the RepositoryExtension this stores and retrieves all documents,
 * repository documents and non persistent documents like tracker documents alike.
 *
 * IMPORTANT: For the cache to work it must be loaded before the repository extension.
 */
export class CacheExtension implements Extension {
  readonly #redis: Redis
  readonly #errorHandler: CollaborationServerErrorHandler

  constructor(configuration: CacheExtensionConfiguration) {
    this.#redis = configuration.redis
    this.#errorHandler = configuration.errorHandler
  }

  async onLoadDocument(payload: onLoadDocumentPayload) {
    try {
      // Only require correct context for real uuid documents
      if ((isValidUUID(payload.documentName) && !isContext(payload.context))) {
        throw new Error(`Invalid context received in CacheExtension.onLoadDocument for ${payload.documentName}`)
      }

      const update = await this.#redis.get(payload.documentName)
      if (update) {
        Y.applyUpdate(payload.document, update)

        // Add a flag to the context to signal that this request is taken care of
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
    await this.#redis.store(
      documentName,
      Buffer.from(Y.encodeStateAsUpdate(document))
    )
  }
}
