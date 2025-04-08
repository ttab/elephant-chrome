import * as Y from 'yjs'
import type {
  afterUnloadDocumentPayload,
  connectedPayload,
  Extension,
  onDisconnectPayload
} from '@hocuspocus/server'
import logger from '../../lib/logger.js'
import type { RedisCache } from '../RedisCache.js'

interface EleContext {
  user: {
    sub: string
    preferred_username: string
    name: string
  }
}

interface EleConnectedPayload extends connectedPayload {
  context: EleContext
}

interface EleOnDisconnectPayload extends onDisconnectPayload {
  context: EleContext
}

type CollaborationSnapshot = Record<string, {
  id: string
  users: Record<string, {
    id: string
    userName: string
    name: string
    count: number
  }>
}>

/**
 * OpenDocuments extension for Hocuspocus
 *
 * Tracks which documents are open and which users have them open.
 * Maintains this data in a special 'document-tracker' Y.Doc.
 */
export class OpenDocuments implements Extension {
  readonly #name = 'document-tracker'
  readonly #doc: Y.Doc
  readonly #redisCache: RedisCache

  constructor({ redisCache }: { redisCache: RedisCache }) {
    this.#redisCache = redisCache
    this.#doc = new Y.Doc()
  }

  /**
   * Fetch update state from redis if it already exists. Otherwise
   * create a new state and store it in redis.
   */
  async onConfigure(): Promise<void> {
    // Get existing state from redis cache
    const existingState = await this.#redisCache.get(this.#name)

    if (existingState) {
      Y.applyUpdate(this.#doc, existingState)
    } else {
      await this.#redisCache.store(
        this.#name,
        Buffer.from(
          Y.encodeStateAsUpdate(this.#doc)
        )
      )
    }
  }

  /**
   * Convenience method to check whether it is a tracking document.
   */
  isTrackerDocument(documentName: string): boolean {
    return this.#name === documentName
  }

  /**
   * Add user that opened the document to the correct document in the tracker.
   */
  async connected({ documentName, context }: EleConnectedPayload) {
    if (this.isTrackerDocument(documentName)) {
      return Promise.resolve()
    }

    const {
      sub: userId,
      preferred_username: userName,
      name
    } = context.user

    const yOpenDocuments = this.#doc.getMap('open-documents')

    this.#doc.transact(() => {
      let yDocEntry = yOpenDocuments.get(documentName) as Y.Map<unknown>

      if (!yDocEntry) {
        yDocEntry = new Y.Map()
        yOpenDocuments.set(documentName, yDocEntry)

        // First connection to this document, create new document entry
        const yUsers = new Y.Map()
        yUsers.set(
          userId,
          this.#getUserYMap(userId, userName, name)
        )

        yDocEntry.set('count', 1)
        yDocEntry.set('id', documentName)
        yDocEntry.set('users', yUsers)
      } else {
        // Document already connected
        const yUsers = yDocEntry.get('users') as Y.Map<unknown>
        const yUser = yUsers.get(userId) as Y.Map<unknown>

        if (!yUser) {
          // First time this users is connected
          yUsers.set(
            userId,
            this.#getUserYMap(userId, userName, name)
          )
        } else {
          // User already connected to document, increase connection count
          yUser.set('count', yUser.get('count') ?? 0 + 1)
        }

        // Increase total document connection count
        yDocEntry.set('count', yDocEntry.get('count') ?? 0 + 1)
      }
    })
  }

  /**
   * Create initial user Y.Map.
   */
  #getUserYMap(id: string, username: string, name: string): Y.Map<unknown> {
    const yUser = new Y.Map()
    yUser.set('id', id)
    yUser.set('username', username)
    yUser.set('name', name)
    yUser.set('count', 1)

    return yUser
  }

  /**
   * Remove the user (or decrease count) from a tracked document userlist.
   */
  async onDisconnect({ documentName, context }: EleOnDisconnectPayload) {
    if (this.isTrackerDocument(documentName)) {
      return Promise.resolve()
    }

    const { sub: userId } = context.user
    const yOpenDocuments = this.#doc.getMap('open-documents')
    const yDocEntry = yOpenDocuments.get(documentName) as Y.Map<unknown>

    if (!yDocEntry?.size) {
      logger.warn(`Client <${userId}> disconnected from <${documentName}> but there was no document entry in open-documents`)
      return
    }

    this.#doc.transact(() => {
      const yUsers = yDocEntry.get('users') as Y.Map<unknown>
      const yUser = yUsers.get(userId) as Y.Map<unknown>
      const count = yUser.get('count') as number

      if (count <= 1) {
        yUsers.delete(userId)
      } else {
        yUser.set('count', count - 1)
      }
      yDocEntry.set('count', yDocEntry.get('count') ?? 0 - 1)
    })
  }

  /**
   * Called when no one has the document open anymore.
   * Remove this document from tracked documents.
   */
  async afterUnloadDocument({ documentName }: afterUnloadDocumentPayload) {
    if (this.isTrackerDocument(documentName)) {
      return Promise.resolve()
    }

    const yOpenDocuments = this.#doc.getMap('open-documents')
    yOpenDocuments.delete(documentName)
  }

  /**
   * Get a snapshot of all tracked documents and their users.
   */
  getSnapshot(): CollaborationSnapshot {
    const yOpenDocuments = this.#doc.getMap('open-documents')
    return yOpenDocuments.toJSON()
  }
}
