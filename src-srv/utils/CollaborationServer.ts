import {
  Server,
  type Hocuspocus,
  type fetchPayload,
  type storePayload,
  type onAuthenticatePayload,
  type afterUnloadDocumentPayload,
  type connectedPayload,
  type onDisconnectPayload
} from '@hocuspocus/server'

import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'
import type { RedisCache } from './RedisCache.js'
import type { Repository } from './Repository.js'
import {
  decodeJwt,
  type JWTPayload
} from 'jose'

import {
  type Application
} from 'express-ws'


import { slateNodesToInsertDelta } from '@slate-yjs/core'
import * as Y from 'yjs'
import {
  newsDocToSlate,
  newsDocToYmap
} from './transformations/index.js'
import { newsDocToYPlanning } from './transformations/yjs/yPlanning.js'

enum DocumentType {
  ARTICLE = 'core/article',
  PLANNING = 'core/planning-item'
}

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
  readonly #name: string
  readonly #port: number
  readonly #quiet: boolean
  readonly #expressServer: Application
  readonly #server: Hocuspocus
  readonly #repository: Repository
  readonly #redisCache: RedisCache
  #handlePaths: string[]
  #openForBusiness: boolean
  #openDocuments?: Y.Doc

  /**
   * Collaboration server constructor. Creates and initializes
   * a Hocuspocus server and it's extensions. Call listen() to
   * open collaboration server for business.
   */
  constructor({ name, port, redisUrl, redisCache, repository, expressServer, quiet = false }: CollaborationServerOptions) {
    this.#quiet = quiet
    this.#port = port
    this.#name = name
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

    this.#server = Server.configure({
      name: this.#name,
      port: this.#port,
      timeout: 30000,
      debounce: 5000,
      maxDebounce: 30000,
      quiet: this.#quiet,
      extensions: [
        new Logger(),
        new Redis({
          prefix: 'elc::hp',
          host: redisHost,
          port: parseInt(redisPort, 10),
          options: {
            username: redisUsername,
            password: redisPassword,
            tls: redisProtocol === 'rediss'
          }
        }),
        new Database({
          fetch: async (payload) => { return await this.#fetchDocument(payload) },
          store: async (payload) => { await this.#storeDocument(payload) }
        })
      ],
      onAuthenticate: async (payload) => { return await this.#authenticate(payload) },

      // Add user as having a tracked document open (or increase nr of times user have it open)
      connected: async (payload) => { await this.#connected(payload) },

      // Remove user from having a tracked doc open (or decrease the nr of times user have it open)
      onDisconnect: async (payload) => { await this.#onDisconnect(payload) },

      // No users have this doc open, remove it from tracked documents
      afterUnloadDocument: async (payload) => { await this.#afterUnloadDocument(payload) }
    })

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
      console.warn('Collab server already open for business, closing, cleaning up and reinitializing')
      await this.close()
    }

    try {
      paths.forEach(path => {
        this.#expressServer.ws(path, (websocket, request) => {
          this.#server.handleConnection(websocket, request)
        })
      })
    } catch (ex) {
      console.error(ex)
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
      console.error(ex)
    } finally {
      this.#openForBusiness = false
      this.#handlePaths = []
    }
  }


  /**
   * Authenticate using token
   */
  async #authenticate({ token }: onAuthenticatePayload): Promise<{
    token: string
    user: JWTPayload
  }> {
    try {
      await this.#repository.validateToken(token)
    } catch (ex) {
      throw new Error('Could not authenticate', { cause: ex })
    }

    return {
      token,
      user: { ...decodeJwt(token) }
    }
  }


  /**
   * Fetch document from redis if already in cache, otherwise from repository
   */
  async #fetchDocument({ documentName: uuid, document: yDoc, context }: fetchPayload): Promise<Uint8Array | null> {
    // Init tracking document. Must not be fetched from cache when starting up the server fresh.
    if (uuid === 'document-tracker') {
      this.#openDocuments = yDoc

      const documents = yDoc.getMap('open-documents')
      yDoc.share.set('open-documents', yMapAsYEventAny(documents))
      return Y.encodeStateAsUpdate(yDoc)
    }

    // Fetch from Redis if exists
    const state = await this.#redisCache.get(uuid)
    if (state) {
      return state
    }

    // Fetch content
    const documentResponse = await this.#repository.getDoc({
      uuid,
      accessToken: context.token
    })
    const { document } = documentResponse

    // Share complete original document
    const newsDocYMap = newsDocToYmap(documentResponse, yDoc.getMap('original'))
    yDoc.share.set('original', yMapAsYEventAny(newsDocYMap))

    if (document?.type === DocumentType.ARTICLE) {
      // Share editable content
      const slateDocument = newsDocToSlate(document?.content ?? [])
      const sharedContent = yDoc.get('content', Y.XmlText) as Y.XmlText
      sharedContent.applyDelta(
        slateNodesToInsertDelta(slateDocument)
      )

      const yArticle = yDoc.getMap('article')
      const parsed = newsDocToYPlanning(document, yArticle)
      yDoc.share.set('article', yMapAsYEventAny(parsed))
      return Y.encodeStateAsUpdate(yDoc)
    }

    if (document?.type === DocumentType.PLANNING) {
      try {
        const planningYMap = yDoc.getMap('planning')

        const parsed = newsDocToYPlanning(document, planningYMap)
        yDoc.share.set('planning', yMapAsYEventAny(parsed))

        return Y.encodeStateAsUpdate(yDoc)
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(err.message)
        }
        throw new Error('Unknown error in parsing Planning')
      }
    }

    throw new Error('Can\'t determine DocumentType')
  }


  /**
   * Called for every provider that connects to track a specific document.
   *
   * Action: Add user that opened the document to the correct document in the document
   * tracker document. Or increase the number of times the user have this document open.
   */
  async #connected({ documentName, context, socketId }: connectedPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return
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
   * Action: Remove the user (or decrease count) from a tracked document userlist
   */
  async #onDisconnect({ documentName, context }: onDisconnectPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return
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
      return
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
    if (!await this.#redisCache.store(documentName, state)) {
      console.error(`Failed storing ${documentName} in cache`)
    }
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
      yUsersMap.forEach(yUser => {
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
