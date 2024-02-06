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
      afterUnloadDocument: async (payload) => { await this.#afterUnloadDocument(payload) },
      connected: async (payload) => { await this.#connected(payload) },
      onDisconnect: async (payload) => { await this.#onDisconnect(payload) }
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
    if (uuid === 'document-tracker' && !this.#openDocuments) {
      if (!this.#openDocuments) {
        this.#openDocuments = yDoc
      }

      const documents = yDoc.getMap('documents')
      yDoc.share.set('documents', yMapAsYEventAny(documents))
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

      // Share meta data map
      const newsValue = document?.meta.find(i => i.type === 'core/newsvalue')
      const metaYMap = yDoc.getMap('meta')
      metaYMap.set('core/newsvalue/score', newsValue?.data.score || 0)
      metaYMap.set('core/newsvalue/duration', newsValue?.data.duration || undefined)
      metaYMap.set('core/newsvalue/end', newsValue?.data.end || undefined)
      yDoc.share.set('meta', yMapAsYEventAny(metaYMap))

      return Y.encodeStateAsUpdate(yDoc)
    }

    if (document?.type === DocumentType.PLANNING) {
      const title = document?.title
      const sector = document?.links.find(l => l.type === 'tt/sector')
      const assignee = document.meta?.find(m => m.type === 'core/assignment')?.links
        .find(l => l.type === 'core/author')
      const planningItem = document?.meta.find(m => m.type === 'core/planning-item')

      const description = document?.meta.find(i => i.type === 'core/description')
      const assignments = document?.meta.filter(i => i.type === 'core/assignment')

      const planningYMap = yDoc.getMap('planning')

      planningYMap.set('core/planning-item/title', title || '')
      planningYMap.set('core/planning-item/sector', sector?.title || '')
      planningYMap.set('core/planning-item/status', planningItem?.data.public || 'false')
      planningYMap.set('core/planning-item/start', planningItem?.data.start_date || '')
      planningYMap.set('core/planning-item/end', planningItem?.data.end_date || '')
      planningYMap.set('core/author', assignee?.name.replace('/TT', '') || '')
      planningYMap.set('core/planning-item/priority', planningItem?.data.priority || 0)


      planningYMap.set('core/description/text', description?.data.text || '')
      planningYMap.set('core/assignments', assignments || [])


      yDoc.share.set('planning', yMapAsYEventAny(planningYMap))

      return Y.encodeStateAsUpdate(yDoc)
    }

    throw new Error('Can\'t determine DocumentType')
  }


  /**
   * Called for every provider that connects to track a specific document.
   *
   * Add user that opened the document to the correct document in the document tracker document.
   * (Or increase the number of times the user have this document open.)
   */
  async #connected({ documentName, context, socketId }: connectedPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return
    }

    const { sub: userId, sub_name: userName } = context.user as { sub: string, sub_name: string }
    const trackedDocuments = this.#openDocuments.getMap('documents')
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
   * Remove the user (or decrease count) from tracked document userlist
   */
  async #onDisconnect({ documentName, context }: onDisconnectPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return
    }

    const { sub: userId } = context.user as { sub: string, sub_name: string }
    const documents = this.#openDocuments.getMap('documents')
    const documentUsersList = documents.get(documentName) as Y.Map<unknown>

    if (documentUsersList) {
      const user = documentUsersList.get(userId) as Y.Map<unknown>
      const count = user?.get('count') as number || 0
      if (count) {
        user.set('count', count - 1)
        console.log('    :: ODC', `decreased user count for document <${documentName}>`)
      } else {
        documentUsersList.delete(documentName)
        console.log('    :: ODC', `removed user from tracking document <${documentName}>`)
      }
    }
  }


  /**
   * Called when no one have the document open anylonger.
   *
   * Remove this document from tracked documents so that the tracker document does not grow indefinitely
   */
  async #afterUnloadDocument({ documentName }: afterUnloadDocumentPayload): Promise<void> {
    if (!this.#openDocuments || documentName === 'document-tracker') {
      return
    }

    const documents = this.#openDocuments.getMap('documents')
    const documentUsersList = documents.get(documentName) as Y.Map<unknown>

    if (documentUsersList && !documentUsersList.size) {
      documents.delete(documentName)
      console.log('    :: ULD', `REMOVED document <${documentName}> from tracked documents`)
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

    const yDocMap: Y.Map<Y.Map<Y.Map<string>>> = this.#openDocuments.getMap('documents')
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
