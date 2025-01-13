import {
  Server,
  type Hocuspocus,
  type fetchPayload,
  type connectedPayload,
  type storePayload,
  type afterUnloadDocumentPayload,
  type onDisconnectPayload,
  type onStoreDocumentPayload,
  type onStatelessPayload
} from '@hocuspocus/server'

import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'

import type { RedisCache } from './RedisCache.js'
import type { Repository } from '@/shared/Repository.js'

import {
  type Application
} from 'express-ws'


import * as Y from 'yjs'
import { Snapshot } from './extensions/snapshot.js'
import { Auth } from './extensions/auth.js'
import { StatelessType, parseStateless } from '@/shared/stateless.js'

import { fromGroupedNewsDoc, toGroupedNewsDoc } from './transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc, toYjsNewsDoc } from './transformations/yjsNewsDoc.js'
import CollaborationServerErrorHandler from '../lib/errorHandler.js'
import logger from '../lib/logger.js'
import { type GetDocumentResponse } from '@ttab/elephant-api/repository'

interface CollaborationServerOptions {
  name: string
  port: number
  redisUrl: string
  redisCache: RedisCache
  repository: Repository
  expressServer: Application
  quiet?: boolean
}

interface CollaborationSnapshotUser {
  userId: string
  userName: string
  count: number
  socketId: string
}

type CollaborationSnapshot = Array<{
  uuid: string
  users: CollaborationSnapshotUser[]
}>

export class CollaborationServer {
  readonly #port: number
  readonly #quiet: boolean
  readonly #expressServer: Application
  readonly #server: Hocuspocus
  readonly #repository: Repository
  readonly #redisCache: RedisCache
  readonly #errorHandler: CollaborationServerErrorHandler
  #handlePaths: string[]
  #openForBusiness: boolean
  #openDocuments?: Y.Doc

  /**
   * Collaboration server constructor. Creates and initializes
   * a Hocuspocus server and it's extensions. Call listen() to
   * open collaboration server for business.
   */
  constructor({ port, redisUrl, redisCache, repository, expressServer, quiet = false }: CollaborationServerOptions) {
    this.#quiet = quiet
    this.#port = port
    this.#expressServer = expressServer
    this.#redisCache = redisCache
    this.#repository = repository

    const {
      host: redisHost,
      port: redisPort,
      username: redisUsername,
      password: redisPassword,
      protocol: redisProtocol
    } = new URL(redisUrl)

    this.#quiet = process.env.LOG_LEVEL !== 'info' && process.env.LOG_LEVEL !== 'debug'

    this.#server = Server.configure({
      port: this.#port,
      timeout: 30000,
      debounce: 5000,
      maxDebounce: 30000,
      quiet: this.#quiet,
      extensions: [
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
        new Database({
          fetch: async (payload: fetchPayload) => {
            const document = await this.#fetchDocument(payload).catch((ex) => {
              this.#errorHandler.error(ex)
            })

            return document || null
          },
          store: async (payload) => {
            await this.#storeDocument(payload).catch((ex) => {
              this.#errorHandler.error(ex)
            })
          }
        }),
        new Snapshot({
          debounce: 120000,
          snapshot: (payload: onStoreDocumentPayload) => {
            return async () => {
              await this.#snapshotDocument(payload).catch((ex) => {
                this.#errorHandler.error(ex, {
                  id: payload.documentName,
                  accessToken: payload.context.accessToken
                })
              })
            }
          }
        }),
        // TODO: Handle Auth/token validation errors
        new Auth()
      ],

      // Add user as having a tracked document open (or increase nr of times
      // user have it open)
      connected: async (payload) => {
        await this.#connected(payload).catch((ex) => {
          this.#errorHandler.error(ex)
        })
      },

      // Remove user from having a tracked doc open (or decrease the nr of times
      // user have it open)
      onDisconnect: async (payload) => {
        await this.#onDisconnect(payload).catch((ex) => {
          this.#errorHandler.error(ex)
        })
      },

      // No users have this doc open, remove it from tracked documents
      afterUnloadDocument: async (payload) => {
        await this.#afterUnloadDocument(payload).catch((ex) => {
          this.#errorHandler.error(ex)
        })
      },

      onStateless: async (payload) => {
        await this.#statelessHandler(payload).catch((ex) => {
          this.#errorHandler.error(ex)
        })
      }
    })

    this.#errorHandler = new CollaborationServerErrorHandler(this.#server)

    this.#handlePaths = []
    this.#openForBusiness = false
  }


  /**
   * Start listening for websocket connections on all specified paths
   */
  async listen(paths: string[]): Promise<boolean> {
    if (!this.#server || !this.#expressServer) {
      return false
    }

    if (this.#handlePaths.length || this.#openForBusiness) {
      this.#errorHandler.warn('Collab server already open for business, closing, cleaning up and reinitializing')
      await this.close()
    }

    try {
      paths.forEach((path) => {
        this.#expressServer.ws(path, (websocket, request) => {
          this.#server.handleConnection(websocket, request)
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
    if (!this.#server || !this.#openForBusiness) {
      return
    }

    try {
      await this.#server.destroy()
    } catch (ex) {
      this.#errorHandler.error(ex)
    } finally {
      this.#openForBusiness = false
      this.#handlePaths = []
    }
  }

  async #statelessHandler(payload: onStatelessPayload): Promise<void> {
    const msg = parseStateless(payload.payload)

    if (msg.type === StatelessType.IN_PROGRESS && !msg.message.state) {
      const userTrackerConnection = await this.#server.openDirectConnection(
        msg.message.context.user.sub, { ...msg.message.context, agent: 'server' }
      ).catch((ex) => {
        throw new Error('acquire connection', { cause: ex })
      })

      const connection = await this.#server.openDirectConnection(
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
      } = await fromYjsNewsDoc(connection.document)

      // We should always have a new hash but fallback to original
      await this.#storeDocumentInRepository(
        msg.message.id,
        await fromGroupedNewsDoc(documentResponse),
        updatedHash || originalHash,
        msg.message.context.accessToken,
        msg.message.context
      )

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
    }
  }

  /**
   * Fetch document from redis if already in cache, otherwise from repository
   */
  async #fetchDocument({ documentName: uuid, document: yDoc, context }: fetchPayload): Promise<Uint8Array | null> {
    // Init tracking document. Must not be fetched from cache when starting up the server fresh.
    if (uuid === 'document-tracker') {
      if (this.#openDocuments) {
        return null
      }

      this.#openDocuments = yDoc

      const documents = yDoc.getMap('open-documents')
      yDoc.share.set('open-documents', yMapAsYEventAny(documents))
      return Y.encodeStateAsUpdate(yDoc)
    }

    if (uuid.startsWith('core://user')) {
      return null
    }

    // Fetch from Redis if exists
    const state = await this.#redisCache.get(uuid).catch((ex) => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      return state
    }

    // Fetch content
    const newsDoc = await this.#repository.getDoc({
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

  async #snapshotDocument({ documentName, document: yDoc, context }: onStoreDocumentPayload): Promise<void> {
    // Ignore __inProgress documents
    if ((yDoc.getMap('ele')
      .get('root') as Y.Map<unknown>)
      .get('__inProgress') as boolean) {
      logger.debug('::: Snapshot document: Document is in progress, not saving')
      return
    }

    const { documentResponse, updatedHash } = await fromYjsNewsDoc(yDoc)
    if (!updatedHash) {
      logger.debug('::: saveDoc: No changes in document')
      return
    }

    await this.#storeDocumentInRepository(
      documentName,
      await fromGroupedNewsDoc(documentResponse),
      updatedHash,
      context.accessToken as string,
      context
    )
  }

  async #storeDocumentInRepository(
    documentName: string,
    documentResponse: GetDocumentResponse,
    updatedHash: number,
    accessToken: string,
    context: unknown): Promise<void> {
    const { document, version } = documentResponse
    if (!document) {
      throw new Error(`Store document ${documentName} failed, no document in GetDocumentResponse parameter`)
    }

    const result = await this.#repository.saveDoc(
      document,
      accessToken,
      version
    )

    if (result?.status.code !== 'OK') {
      // TODO: what does an error response look like? Is it parsed? A full twirp
      // error response looks like this:
      // https://twitchtv.github.io/twirp/docs/errors.html#metadata
      throw new Error('Save snapshot document to repository failed', { cause: result })
    }

    const connection = await this.#server.openDirectConnection(documentName, {
      ...context as Record<string, unknown> || {},
      agent: 'server'
    }).catch((ex) => {
      throw new Error('Open hocuspocus connection failed', { cause: ex })
    })

    await connection.transact((doc) => {
      const versionMap = doc.getMap('version')
      const hashMap = doc.getMap('hash')

      versionMap.set('version', result?.response.version.toString())
      hashMap.set('hash', updatedHash)
    }).catch((ex) => {
      throw new Error('Update document with new hash and version failed', { cause: ex })
    })

    logger.debug('::: Document saved to repository: ', result.response.version, 'new hash:', updatedHash)
  }

  /**
   * Called for every provider that connects to track a specific document.
   *
   * Action: Add user that opened the document to the correct document in the document
   * tracker document. Or increase the number of times the user have this document open.
   */
  async #connected({ documentName, context, socketId }: connectedPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return await Promise.resolve()
    }

    const { sub: userId, sub_name: userName } = context.user as { sub: string, sub_name: string }
    const trackedDocuments = this.#openDocuments.getMap('open-documents')
    const userList = trackedDocuments.get(documentName) as Y.Map<unknown>

    let trackingUser: Y.Map<unknown> = userList?.get(userId) as Y.Map<unknown> || null
    const trackingUserExisted = !!trackingUser

    if (!trackingUser) {
      trackingUser = new Y.Map()
      trackingUser.set('userId', userId)
      trackingUser.set('userName', userName)
      trackingUser.set('count', 1)
      trackingUser.set('socketId', socketId)
    } else {
      const count = trackingUser.get('count') as number
      trackingUser.set('count', count + 1)
    }

    if (!userList) {
      const newUserList: Y.Map<unknown> = new Y.Map()
      newUserList.set(userId, trackingUser)
      trackedDocuments.set(documentName, newUserList)
    } else if (!trackingUserExisted) {
      userList.set(userId, trackingUser)
    }
  }

  /*
   * Called for every provider that diconnects for tracking a specific document.
   *
   * Action: Save the document if changes has been made
   * Action: Remove the user (or decrease count) from a tracked document userlist
   */
  async #onDisconnect({ documentName, context }: onDisconnectPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return await Promise.resolve()
    }

    const { sub: userId } = context.user as { sub: string, sub_name: string }
    const documents = this.#openDocuments.getMap('open-documents')
    const documentUsersList = documents.get(documentName) as Y.Map<unknown>

    if (documentUsersList) {
      const user = documentUsersList.get(userId) as Y.Map<unknown>
      const count = user?.get('count') as number || 0

      if (count > 1) {
        user.set('count', count - 1)
      } else {
        documentUsersList.delete(userId)
      }
    }
  }


  /**
   * Called when no one have the document open anylonger.
   *
   * Action: Remove this document from tracked documents so that the tracker document does not grow indefinitely
   */
  async #afterUnloadDocument({ documentName }: afterUnloadDocumentPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return await Promise.resolve()
    }

    const documents = this.#openDocuments.getMap('open-documents')
    const documentUsersList = documents.get(documentName) as Y.Map<unknown>

    if (documentUsersList && !documentUsersList.size) {
      documents.delete(documentName)
    }
  }


  /**
   * Store document in redis cache
   */
  async #storeDocument({ documentName, state }: storePayload): Promise<void> {
    await this.#redisCache.store(documentName, state).catch((ex) => {
      this.#errorHandler.error(ex)
    })
  }

  /**
   * Number of HocusPocus provider connections (not number of websocket connections)
   */
  getConnectionsCount(): number {
    return this.#server ? this.#server.getConnectionsCount() : 0
  }

  /**
   * Number of open documents
   */
  getDocumentsCount(): number {
    return this.#server ? this.#server.getDocumentsCount() : 0
  }

  /**
   * Snapshot of open documents and by who
   */
  getSnapshot(): CollaborationSnapshot {
    if (!this.#openDocuments) {
      return []
    }

    const documents: CollaborationSnapshot = [{
      uuid: 'tracker-document',
      users: []
    }]

    const yDocMap: Y.Map<Y.Map<Y.Map<string>>> = this.#openDocuments.getMap('open-documents')
    yDocMap.forEach((yUsersMap, uuid) => {
      const users: CollaborationSnapshotUser[] = []
      yUsersMap.forEach((yUser) => {
        users.push(yUser.toJSON() as CollaborationSnapshotUser)
      })

      documents.push({
        uuid,
        users
      })
    })

    return documents
  }
}

/*
 * Convenience function to cast types without eslint-disables everywhere
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function yMapAsYEventAny(yMap: Y.Map<unknown>): Y.AbstractType<Y.YEvent<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return yMap as unknown as Y.AbstractType<Y.YEvent<any>>
}
