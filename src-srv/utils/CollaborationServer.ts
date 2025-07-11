import {
  Server,
  type Hocuspocus,
  type fetchPayload,
  type storePayload,
  type onStatelessPayload
} from '@hocuspocus/server'

import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'

import type { RedisCache } from './RedisCache.js'
import type { Repository } from '@/shared/Repository.js'
import type { User } from '@/shared/User.js'

import {
  type Application
} from 'express-ws'

import * as Y from 'yjs'
import { Snapshot } from './extensions/Snapshot.js'
import { Auth } from './extensions/Auth.js'
import { OpenDocuments } from './extensions/OpenDocuments.js'
import { StatelessType, parseStateless } from '@/shared/stateless.js'

import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc, toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import CollaborationServerErrorHandler, { getErrorContext, withErrorHandler } from '../lib/errorHandler.js'
import logger from '../lib/logger.js'
import type { UpdateRequest, UpdateResponse } from '@ttab/elephant-api/repository'
import { type GetDocumentResponse } from '@ttab/elephant-api/repository'
import type { FinishedUnaryCall } from '@protobuf-ts/runtime-rpc'
import { type Context, isContext } from '../lib/context.js'
import { isValidUUID } from './isValidUUID.js'

interface CollaborationServerOptions {
  name: string
  port: number
  redisUrl: string
  redisCache: RedisCache
  repository: Repository
  user: User
  expressServer: Application
  quiet?: boolean
}

export class CollaborationServer {
  readonly #port: number
  readonly #quiet: boolean
  readonly #expressServer: Application
  readonly server: Hocuspocus
  readonly #repository: Repository
  readonly #redisCache: RedisCache
  readonly #errorHandler: CollaborationServerErrorHandler
  readonly #openDocuments: OpenDocuments
  #handlePaths: string[]
  #openForBusiness: boolean

  /**
   * Collaboration server constructor. Creates and initializes
   * a Hocuspocus server and it's extensions. Call listen() to
   * open collaboration server for business.
   */
  constructor({ port, redisUrl, redisCache, repository, expressServer, user, quiet = false }: CollaborationServerOptions) {
    this.#quiet = quiet
    this.#port = port
    this.#expressServer = expressServer
    this.#redisCache = redisCache
    this.#repository = repository
    this.#errorHandler = new CollaborationServerErrorHandler(user)
    this.#openDocuments = new OpenDocuments()

    const {
      host: redisHost,
      port: redisPort,
      username: redisUsername,
      password: redisPassword,
      protocol: redisProtocol
    } = new URL(redisUrl)

    this.#quiet = process.env.LOG_LEVEL !== 'info' && process.env.LOG_LEVEL !== 'debug'

    this.server = Server.configure({
      port: this.#port,
      timeout: 30000,
      debounce: 5000,
      maxDebounce: 30000,
      quiet: this.#quiet,
      extensions: withErrorHandler([
        new Logger({
          log: (msg) => {
            logger.info(msg)
          }
        }),
        new Redis({
          prefix: 'elc::hp',
          host: redisHost,
          port: parseInt(redisPort, 10),
          options: {
            username: redisUsername,
            password: redisPassword,
            tls: redisProtocol === 'rediss:'
          }
        }),
        this.#openDocuments,
        new Database({
          fetch: async (payload: fetchPayload) => {
            const document = await this.#fetchDocument(payload).catch((ex) => {
              const ctx = getErrorContext(payload)
              this.#errorHandler.error(ex, ctx)
            })

            return document || null
          },
          store: async (payload: storePayload) => {
            await this.#storeDocument(payload).catch((ex) => {
              const ctx = getErrorContext(payload)
              this.#errorHandler.error(ex, ctx)
            })
          }
        }),
        new Snapshot({
          debounce: 120000
        }),
        new Auth()
      ], this.#errorHandler),

      onStateless: async (payload: onStatelessPayload) => {
        await this.#statelessHandler(payload).catch((ex) => {
          const ctx = getErrorContext(payload)
          this.#errorHandler.error(ex, ctx)
        })
      }
    })

    this.#handlePaths = []
    this.#openForBusiness = false
  }


  /**
   * Start listening for websocket connections on all specified paths
   */
  async listen(paths: string[]): Promise<boolean> {
    if (!this.server || !this.#expressServer) {
      return false
    }

    if (this.#handlePaths.length || this.#openForBusiness) {
      this.#errorHandler.warn('Collab server already open for business, closing, cleaning up and reinitializing')
      await this.close()
    }

    // Apply the server to errorHandler
    this.#errorHandler.setServer(this.server)

    try {
      paths.forEach((path) => {
        this.#expressServer.ws(path, (websocket, request) => {
          this.server.handleConnection(websocket, request)
        })
      })
    } catch (ex) {
      this.#errorHandler.fatal(ex)
      return false
    }

    return true
  }


  /**
   * Stop listening for incoming requests, clear paths to listen from.
   * This allows the server to reinitialize itself.
   */
  async close(): Promise<void> {
    if (!this.server || !this.#openForBusiness) {
      return
    }

    try {
      await this.server.destroy()
    } catch (ex) {
      this.#errorHandler.error(ex)
    } finally {
      this.#openForBusiness = false
      this.#handlePaths = []
    }
  }

  /* Handles the removal of `__inProgress` flag and stores the document in the repository
  * Subsequently adds the transaction to the userTracker document
  * */
  async #statelessHandler(payload: onStatelessPayload): Promise<void> {
    const msg = parseStateless(payload.payload)

    if (msg.type === StatelessType.IN_PROGRESS && !msg.message.state) {
      const userTrackerConnection = await this.server.openDirectConnection(
        msg.message.context.user.sub
          .replace('core://user/', ''),
        { ...msg.message.context, agent: 'server' }
      ).catch((ex) => {
        throw new Error('acquire connection', { cause: ex })
      })

      const connection = await this.server.openDirectConnection(
        msg.message.id, { ...msg.message.context, agent: 'server' }
      ).catch((ex) => {
        throw new Error('acquire connection', { cause: ex })
      })

      await connection.transact((doc) => {
        const ele = doc.getMap('ele')
        const root = ele.get('root') as Y.Map<unknown>
        root.delete('__inProgress')
      }).catch((ex) => {
        throw new Error('remove in progress flag', { cause: ex })
      })

      if (!connection.document || !msg.message.context) {
        return
      }

      const {
        documentResponse,
        updatedHash,
        originalHash
      } = fromYjsNewsDoc(connection.document)

      // We should always have a new hash but fallback to original
      await this.#storeDocumentInRepository(
        msg.message.id,
        fromGroupedNewsDoc(documentResponse),
        updatedHash || originalHash,
        msg.message.context.accessToken,
        msg.message.context,
        msg.message.status
      )

      // Disconnect document connection
      await connection.disconnect()

      // Create a tracker document that keeps track of the user history
      userTrackerConnection.transact((doc) => {
        const documents = doc.getMap('ele')
        const type = msg.message.context.type

        if (!documents.get(type)) {
          documents.set(type, new Y.Array())
        }

        const items = documents.get(type) as Y.Array<unknown>
        items.push([{ id: msg.message.id, timestamp: Date.now() }])
      }).catch((ex) => {
        throw new Error('error', { cause: ex })
      })

      // Disconnect userTracker connection
      await userTrackerConnection.disconnect()
    }
  }

  /**
   * Fetch document from redis if already in cache, otherwise from repository
   */
  async #fetchDocument({ documentName: uuid, document: yDoc, context }: fetchPayload): Promise<Uint8Array | null> {
    // If the request is the document tracker document
    if (this.#openDocuments.isTrackerDocument(uuid)) {
      const ydoc = this.#openDocuments.getDocument()
      return Y.encodeStateAsUpdate(ydoc)
    }

    if (!isContext(context)) {
      logger.warn({ context, documentName: uuid }, 'Invalid context provided')
      throw new Error('#fetchDocument - Invalid context provided')
    }

    // Fetch from Redis if exists
    const state = await this.#redisCache.get(uuid).catch((ex) => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      return state
    }

    // If not a valid uuid, we're not going to be able to get any from the repository
    // Most likely a userTracker document
    if (!isValidUUID(uuid)) {
      return null
    }

    // Fetch content
    const newsDoc = await this.#repository.getDocument({
      uuid,
      accessToken: context.accessToken
    }).catch((ex) => {
      throw new Error('get document from repository', { cause: ex })
    })

    if (newsDoc) {
      toYjsNewsDoc(
        toGroupedNewsDoc(newsDoc),
        yDoc
      )
    }

    // This is a new and unknown yDoc initiated from the client. Just return it
    // as an encoded state update and trust the client to set properties and the
    // hocuspocus client/server comm to sync the changes and store them in redis.
    return Y.encodeStateAsUpdate(yDoc)
  }

  async snapshotDocument({ documentName, document: yDoc, context, force = false, transacting = false, status, cause }: {
    documentName: string
    document: Y.Doc
    context: Context
    force?: boolean
    status?: string
    cause?: string
    transacting?: boolean
  }): Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse> | null> {
    // Ignore userTracker documents and invalid uuids, most likely same as the first
    if (context.user.sub?.endsWith(documentName) || !isValidUUID(documentName)) {
      return null
    }

    // Ignore __inProgress documents
    if ((yDoc.getMap('ele')
      .get('root') as Y.Map<unknown>)
      .get('__inProgress') as boolean) {
      logger.debug('::: Snapshot document: Document is in progress, not saving')
      return null
    }

    const { documentResponse, updatedHash, originalHash } = fromYjsNewsDoc(yDoc)

    // If no updatedHash there is no changes in the document, abort snapshot
    // Unless force is set to true
    if (!updatedHash && !force) {
      logger.debug('::: saveDocument: No changes in document')
      return null
    }

    const hash = updatedHash || originalHash

    return await this.#storeDocumentInRepository(
      documentName,
      fromGroupedNewsDoc(documentResponse),
      hash,
      context.accessToken,
      context,
      status,
      transacting ? yDoc : undefined,
      cause
    )
  }

  async #storeDocumentInRepository(
    documentName: string,
    documentResponse: GetDocumentResponse,
    updatedHash: number,
    accessToken: string,
    context: Context,
    status?: string,
    transactingDoc?: Y.Doc,
    cause?: string
  ): Promise<FinishedUnaryCall<UpdateRequest, UpdateResponse>> {
    const { document } = documentResponse
    if (!document) {
      throw new Error(`Store document ${documentName} failed, no document in GetDocumentResponse parameter`)
    }

    const result = await this.#repository.saveDocument(
      document,
      accessToken,
      status,
      cause
    )

    if (result?.status.code !== 'OK') {
      throw new Error('Save snapshot document to repository failed', { cause: result })
    }

    // Local function to update document version
    const updateDocument = (yDoc: Y.Doc, version: string, updatedHash: number) => {
      const versionMap = yDoc.getMap('version')
      const hashMap = yDoc.getMap('hash')

      versionMap.set('version', version)
      hashMap.set('hash', updatedHash)
    }

    // If we have a Y.Doc in an existing transaction in an existing direct
    // connection we can just make the changes we need and call it quits.
    if (transactingDoc) {
      updateDocument(transactingDoc, result?.response.version.toString(), updatedHash)
      logger.debug(`::: Document saved to repository: ${document.uuid}, version: ${result.response.version} 'new hash:' ${updatedHash}`)
      return result
    }

    // When we don't have a transactingDoc we need to open a new direct
    // connnection and start a transaction to get the Y.Doc to change.
    const connection = await this.server.openDirectConnection(documentName, {
      ...context || {},
      agent: 'server'
    }).catch((ex) => {
      throw new Error('Open hocuspocus connection failed', { cause: ex })
    })

    await connection.transact((doc) => {
      updateDocument(doc, result?.response.version.toString(), updatedHash)
    }).catch((ex) => {
      throw new Error('Update document with new hash and version failed', { cause: ex })
    })

    await connection.disconnect()

    logger.debug(`::: Document saved to repository: ${document.uuid}, version: ${result.response.version} 'new hash:' ${updatedHash}`)
    return result
  }

  /**
   * Store document in redis cache
   */
  async #storeDocument({ documentName, state }: storePayload): Promise<void> {
    await this.#redisCache.store(documentName, state).catch((ex) => {
      throw new Error('store documents state in redis', { cause: ex })
    })
  }

  /**
   * Number of HocusPocus provider connections (not number of websocket connections)
   */
  getConnectionsCount(): number {
    return this.server ? this.server.getConnectionsCount() : 0
  }

  /**
   * Number of open documents
   */
  getDocumentsCount(): number {
    return this.server ? this.server.getDocumentsCount() : 0
  }

  /**
   * Snapshot of open documents and by who
   */
  getSnapshot() {
    return this.#openDocuments.getSnapshot()
  }
}
