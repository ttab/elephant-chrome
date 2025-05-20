import * as Y from 'yjs'
import type {
  afterUnloadDocumentPayload,
  connectedPayload,
  DirectConnection,
  Extension,
  Hocuspocus,
  onConfigurePayload,
  onDisconnectPayload
} from '@hocuspocus/server'
import logger from '../../lib/logger.js'
import { getInterval } from '../../../shared/getInterval.js'

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
  readonly #instanceId: string
  #server?: Hocuspocus
  #connection?: DirectConnection

  constructor() {
    this.#instanceId = crypto.randomUUID()
    this.#doc = new Y.Doc()
  }

  /**
   * Setup interval for last seen timestamps of instances and cleanup. Open a direct
   * connection to HocusPocus server.
   */
  async onConfigure({ instance }: onConfigurePayload): Promise<void> {
    this.#server = instance

    // Initialize connection with the server
    this.#connection = await this.#server.openDirectConnection('document-tracker', {
      agent: 'server'
    })

    // Periodically update the instance last seen timestamp
    this.#updateInstanceLastSeen()
    setInterval(() => void this.#updateInstanceLastSeen(), getInterval(25, 35))

    // Periodically check that all instances are connected and clean up if not.
    setInterval(() => void this.#cleanupIfNecessary(), getInterval(100, 140))
  }

  /**
   * Update the shared instances map with a fresh timestamp for this instance id.
   */
  #updateInstanceLastSeen() {
    if (!this.#connection) return

    void this.#connection.transact((doc) => {
      const yInstances = doc.getMap('instances')
      yInstances.set(this.#instanceId, Date.now())
    })
  }

  /**
   * Check that all instances have been seen lately. If it was last
   * seen more than this.#ttl seconds ago we clean out the instance and
   * remove all open document count references related to that instance.
   */
  #cleanupIfNecessary() {
    if (!this.#connection) return

    const lostInstances: string[] = []

    void this.#connection.transact((doc) => {
      const now = Date.now()
      const yInstances = doc.getMap<number>('instances')

      yInstances.forEach((timestamp, instanceId) => {
        if (instanceId === this.#instanceId) return

        const seconds = Math.floor((now - timestamp) / 1000)
        if (seconds >= this.#ttl) {
          logger.warn(`Instance <${instanceId}> last seen ${seconds} secs ago. Removing all references!`)
          lostInstances.push(instanceId)
          yInstances.delete(instanceId)
        }
      })
    })

    if (!lostInstances.length) return

    // Cleanup all open document references
    void this.#connection.transact((doc) => {
      const yOpenDocuments = doc.getMap<Y.Map<unknown>>('open-documents')

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
    if (this.isTrackerDocument(documentName)) return

    const { sub: userId, preferred_username: userName, name } = context.user || {}

    if (!userId || !userName || name) {
      logger.warn({ documentName, context }, 'User information is missing for OpenDocuments.connected')
      throw new Error('User information is missing for OpenDocuments.connected')
    }

    await this.#connection?.transact((doc) => {
      const yOpenDocuments = doc.getMap('open-documents')

      let yDocEntry = yOpenDocuments.get(documentName) as Y.Map<unknown>

      if (!yDocEntry) {
        yDocEntry = new Y.Map()
        yOpenDocuments.set(documentName, yDocEntry)

        const yUsers = new Y.Map()
        yUsers.set(userId, this.#getUserYMap(userId, userName, name))

        yDocEntry.set('count', 1)
        yDocEntry.set('id', documentName)
        yDocEntry.set('users', yUsers)
      } else {
        const yUsers = yDocEntry.get('users') as Y.Map<unknown>
        const yUser = yUsers.get(userId) as Y.Map<unknown>

        if (!yUser) {
          yUsers.set(userId, this.#getUserYMap(userId, userName, name))
        } else {
          const count = yUser.get('count') as Y.Array<string>
          count.push([this.#instanceId])
        }

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
    if (this.isTrackerDocument(documentName)) return

    const { sub: userId } = context.user || {}

    if (!userId) {
      logger.warn({ documentName, context }, 'User information is missing for OpenDocuments.onDisconnect')
      throw new Error('User information is missing for OpenDocuments.onDisconnect')
    }

    await this.#connection?.transact((doc) => {
      const yOpenDocuments = doc.getMap('open-documents')
      const yDocEntry = yOpenDocuments.get(documentName) as Y.Map<unknown>

      if (!yDocEntry?.size) {
        logger.warn(`Client <${userId}> on instance <${this.#instanceId}> disconnected from <${documentName}> but there was no document entry in open-documents`)
        return
      }

      const yUsers = yDocEntry.get('users') as Y.Map<unknown>
      const yUser = yUsers.get(userId) as Y.Map<unknown>
      const count = yUser.get('count') as Y.Array<string>

      if (count.length <= 1) {
        yUsers.delete(userId)
      } else {
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
    if (this.isTrackerDocument(documentName)) return

    await this.#connection?.transact((doc) => {
      const yOpenDocuments = doc.getMap('open-documents')
      yOpenDocuments.delete(documentName)
    })
  }

  /**
   * Get reference to the Yjs document
   */
  getDocument(): Y.Doc {
    return this.#doc
  }

  /**
   * Get a snapshot of all tracked documents and their users.
   */
  async getSnapshot(): Promise<CollaborationSnapshot> {
    if (!this.#connection) {
      throw new Error('Tracker document not initialized')
    }

    return new Promise((resolve) => {
      void this.#connection?.transact((doc) => {
        const yOpenDocuments = doc.getMap('open-documents')
        const yInstances = doc.getMap('instances')

        resolve({
          documents: yOpenDocuments.toJSON(),
          instances: yInstances.toJSON()
        })
      })
    })
  }
}
