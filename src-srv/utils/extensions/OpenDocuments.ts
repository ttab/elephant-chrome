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

type CollaborationSnapshot = {
  documents: Record<string, {
    id: string
    users: Record<string, {
      id: string
      userName: string
      name: string
      count: string[]
    }>
  }>
  instances: Record<string, number>
}

/**
 * OpenDocuments extension for Hocuspocus
 *
 * Tracks which documents are open and which users have them open.
 * Maintains this data in a special 'document-tracker' Y.Doc.
 */
export class OpenDocuments implements Extension {
  readonly #name = 'document-tracker'
  readonly #ttl = 120
  readonly #doc: Y.Doc
  readonly #redisCache: RedisCache
  readonly #instanceId: string

  constructor({ redisCache }: { redisCache: RedisCache }) {
    this.#instanceId = crypto.randomUUID()
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

    // Periodically update the instance last seen timestamp
    this.#updateInstanceLastSeen()
    const lastSeen = () => this.#updateInstanceLastSeen()
    setInterval(lastSeen.bind(this), this.#getInterval(25, 35))

    // Periodically check that all instances are connected and clean up if not.
    const cleanup = () => this.#cleanupIfNecessary()
    setInterval(cleanup.bind(this), this.#getInterval(100, 140))
  }

  /**
   * Utility function to get a randomized jitter interval in milliseconds
   * based on min and max number of seconds for intervals. Used to prevent
   * thundering herd problems and reduce risk of instances running cleanup
   * simultaneously.
   */
  #getInterval(min: number, max: number) {
    const minCeiled = Math.ceil(min)
    const maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled) * 1000
  }

  /**
   * Update the shared instances map with a fresh timestamp for this instance id.
   */
  #updateInstanceLastSeen() {
    const yInstances = this.#doc.getMap('instances')
    yInstances.set(this.#instanceId, Date.now())
  }

  /**
   * Check that all instances have been seen lately. If it it was last
   * seen more than this.#ttl seconds ago we clean out the instance and
   * remove all open document count references related to that instance.
   */
  #cleanupIfNecessary() {
    const lostInstances: string[] = []

    this.#doc.transact(() => {
      const now = Date.now()
      const yInstances = this.#doc.getMap<number>('instances')

      yInstances.forEach((timestamp, instanceId) => {
        if (instanceId === this.#instanceId) {
          return
        }

        const seconds = Math.floor((now - timestamp) / 1000)
        if (seconds >= this.#ttl) {
          logger.warn(`Instance <${instanceId}> last seen ${seconds} secs ago. Removing all references!`)
          lostInstances.push(instanceId)
          yInstances.delete(instanceId)
        }
      })
    })

    if (!lostInstances.length) {
      return
    }

    // Cleanup all open document references
    this.#doc.transact(() => {
      const yOpenDocuments = this.#doc.getMap<Y.Map<unknown>>('open-documents')

      yOpenDocuments.forEach((yDocEntry) => {
        const yUsers = yDocEntry.get('users') as Y.Map<Y.Map<unknown>>

        yUsers.forEach((yUser) => {
          const count = yUser.get('count') as Y.Array<string>

          for (let n = count.length - 1; n >= 0; n--) {
            if (lostInstances.includes(count.get(n))) {
              count.delete(n)
            }
          }

          if (!count.length) {
            yUsers.delete(yUser.get('id') as string)
          }
        })

        if (!yUsers.size) {
          yOpenDocuments.delete(yDocEntry.get('id') as string)
        }
      })
    })
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
          // User already connected to document, increase connection count,
          // by adding the instance id to the count array. Each instance can
          // appear multiple times and increase the count accordingly.
          const count = yUser.get('count') as Y.Array<string>
          count.push([this.#instanceId])
        }

        // Increase total document connection count
        yDocEntry.set('count', (yDocEntry.get('count') as number ?? 0) + 1)
      }
    })
  }

  /**
   * Create initial user Y.Map.
   */
  #getUserYMap(id: string, username: string, name: string): Y.Map<unknown> {
    const count = new Y.Array()
    count.push([this.#instanceId])

    const yUser = new Y.Map()
    yUser.set('id', id)
    yUser.set('username', username)
    yUser.set('name', name)
    yUser.set('count', count)

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
      logger.warn(`Client <${userId}> on instance <${this.#instanceId}> disconnected from <${documentName}> but there was no document entry in open-documents`)
      return
    }

    this.#doc.transact(() => {
      const yUsers = yDocEntry.get('users') as Y.Map<unknown>
      const yUser = yUsers.get(userId) as Y.Map<unknown>
      const count = yUser.get('count') as Y.Array<string>

      if (count.length <= 1) {
        yUsers.delete(userId)
      } else {
        // Find first occurrence of current instance
        const n = count.toJSON().findIndex((v) => v === this.#instanceId)
        if (n !== -1) {
          count.delete(n)
        } else {
          logger.warn(`Client <${userId}> on instance <${this.#instanceId}> disconnected from <${documentName}> but there was no instance entry in count`)
        }
      }
      yDocEntry.set('count', (yDocEntry.get('count') as number ?? 0) - 1)
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
    const yInstances = this.#doc.getMap('instances')

    return {
      documents: yOpenDocuments.toJSON(),
      instances: yInstances.toJSON()
    }
  }
}
