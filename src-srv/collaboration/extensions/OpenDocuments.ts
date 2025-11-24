import * as Y from 'yjs'
import type {
  DirectConnection,
  Extension,
  Hocuspocus,
  connectedPayload,
  onConfigurePayload,
  onDisconnectPayload,
  onStatelessPayload
} from '@hocuspocus/server'
import logger from '../../lib/logger.js'
import { parseStateless, StatelessType, type StatelessContext } from '@/shared/stateless.js'
import { isContext } from '../../lib/context.js'
import type { Redis } from '../../utils/Redis.js'

interface UserConnection {
  sub: string
  name: string
  email: string
  invisible: boolean
  instanceId: string
  socketId: string
  connectedAt: number
}

interface InstanceInfo {
  lastSeen: number
  activeConnections: number
}

interface EleContext {
  agent?: 'server'
  user: {
    sub: string
    preferred_username: string
    name: string
    email?: string
  }
  invisible?: boolean
}

interface EleConnectedPayload extends connectedPayload {
  context: EleContext
}

/**
 * TrackedDocuments extension for Hocuspocus
 *
 * Tracks which documents are open and which users have them open.
 *
 * Structure:
 * root [this.#map] Y.Map -> documentId -> Y.Array<UserConnection>
 *
 * Each connection is a separate entry. Same user can appear multiple times.
 */
export class OpenDocuments implements Extension {
  readonly priority = 1
  readonly #name = 'tracked-documents'
  readonly #mapName = 'documents'
  readonly #prefix = 'instance'
  readonly #instanceId: string
  #server?: Hocuspocus
  #connection?: DirectConnection
  #localConnectionCount = 0

  readonly #redis: Redis
  readonly #heartbeatInterval = 30000

  constructor({ redis }: { redis: Redis }) {
    this.#instanceId = crypto.randomUUID()
    this.#redis = redis
  }

  /**
   * Setup interval for last seen timestamps of instances and cleanup. Open a direct
   * connection to HocusPocus server.
   */
  async onConfigure({ instance }: onConfigurePayload): Promise<void> {
    await this.#redis.connect()
    this.#server = instance

    this.#connection = await this.#server.openDirectConnection(this.#name, {
      agent: 'server'
    })

    // Initial heartbeat
    await this.#updateHeartbeat()

    // Heartbeat interval
    setInterval(() => {
      this.#updateHeartbeat().catch(console.error)
    }, this.#heartbeatInterval)

    // Cleanup interval
    setInterval(() => {
      this.#cleanupDeadConnections().catch(console.error)
    }, 60000 + Math.random() * 20000)
  }

  /**
   * Update heartbeat in redis with a fresh timestamp for this instance id.
   */
  async #updateHeartbeat(): Promise<void> {
    const data: InstanceInfo = {
      lastSeen: Date.now(),
      activeConnections: this.#localConnectionCount
    }

    await this.#redis.setEx(
      `${this.#prefix}:${this.#instanceId}`,
      JSON.stringify(data),
      Math.ceil(this.#heartbeatInterval * 2 / 1000)
    )
  }

  /**
   * Get all live instances from redis.
   */
  async #getLiveInstances(): Promise<Set<string>> {
    const keys = await this.#redis.keys(`${this.#prefix}:*`)

    // Create unique set of instance IDs
    return new Set(
      keys.map((key) => key.replace(`${this.#redis.prefix}:${this.#prefix}:`, ''))
    )
  }

  /**
   * Remove all connections in the tracker document from instances
   * that are no longer found in redis.
   */
  async #cleanupDeadConnections(): Promise<void> {
    if (!this.#connection) return

    const liveInstances = await this.#getLiveInstances()

    await this.#connection.transact((doc) => {
      const documents = doc.getMap<Y.Array<UserConnection>>(this.#mapName)

      documents.forEach((connections, documentId) => {
        // Delete from end to start to maintain indices
        for (let i = connections.length - 1; i >= 0; i--) {
          const conn = connections.get(i)
          if (!liveInstances.has(conn.instanceId)) {
            connections.delete(i)
          }
        }

        // Remove empty document entries
        if (connections.length === 0) {
          documents.delete(documentId)
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
   * Message handler to receive user invisible mode.
   */
  async onStateless({ payload, connection }: onStatelessPayload): Promise<void> {
    if (!payload.startsWith(`${StatelessType.CONTEXT}@`) || !this.#connection) {
      return
    }

    const context = connection.context as unknown

    if (!isContext(context)) {
      return
    }

    const statelessMessage = parseStateless<StatelessContext>(payload)

    if (typeof statelessMessage.message.invisible === 'boolean') {
      void this.#setConnectionVisibility(
        statelessMessage.message.id,
        connection.socketId,
        statelessMessage.message.invisible
      )
    }

    return Promise.resolve()
  }

  /**
   * Add user that opened the document to the correct document in the tracker.
   */
  async connected({ documentName, context, socketId }: EleConnectedPayload) {
    if (this.isTrackerDocument(documentName)) {
      return
    }

    const { sub, preferred_username: userName, name, email } = context.user || {}
    if (!sub || !userName || !name) {
      logger.warn({ documentName, context }, 'User information is missing for OpenDocuments.connected')
      throw new Error('User information is missing for OpenDocuments.connected')
    }

    // Add connection as invisible user first, if the user wants to be visible
    // a stateless message will follow that sets the user as visible.
    void this.#addConnection(socketId, documentName, sub, name, email, true)

    return Promise.resolve()
  }

  async #addConnection(socketId: string, documentName: string, sub: string, name: string, email: string | undefined, invisible: boolean) {
    if (!this.#connection) return

    await this.#connection.transact((doc) => {
      const documents = doc.getMap<Y.Array<UserConnection>>(this.#mapName)

      let connections = documents.get(documentName)
      if (!connections) {
        connections = new Y.Array()
        documents.set(documentName, connections)
      }

      connections.push([{
        sub,
        name,
        email: email ?? '',
        invisible,
        instanceId: this.#instanceId,
        socketId,
        connectedAt: Date.now()
      }])
    })

    this.#localConnectionCount++
    await this.#updateHeartbeat()
  }

  /**
   * Remove user/document pair from tracker document.
   */
  async onDisconnect({ documentName, socketId }: onDisconnectPayload) {
    if (this.isTrackerDocument(documentName)) {
      return
    }

    await this.#removeConnection(documentName, socketId)
  }

  async #removeConnection(documentName: string, socketId: string) {
    if (!this.#connection) {
      return
    }

    await this.#connection.transact((doc) => {
      const documents = doc.getMap<Y.Array<UserConnection>>(this.#mapName)
      const connections = documents.get(documentName)

      console.log('Removing ', documentName, 'from', connections?.toJSON())
      if (!connections) {
        return
      }

      // Find and remove the connection
      for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections.get(i)
        if (conn.instanceId === this.#instanceId && conn.socketId === socketId) {
          connections.delete(i)
          break
        }
      }

      // Remove empty document entries
      if (connections.length === 0) {
        documents.delete(documentName)
      }
    })

    this.#localConnectionCount--
    await this.#updateHeartbeat()
  }

  async #setConnectionVisibility(documentName: string, socketId: string, invisible: boolean) {
    if (!this.#connection) {
      return
    }

    await this.#connection.transact((doc) => {
      const documents = doc.getMap<Y.Array<UserConnection>>(this.#mapName)
      const connections = documents.get(documentName)

      if (!connections) {
        return
      }

      // Find the connection
      for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections.get(i)
        if (conn.instanceId === this.#instanceId && conn.socketId === socketId) {
          const updatedConn: UserConnection = { ...conn, invisible }
          connections.push([updatedConn])
          break
        }
      }

      console.log(doc.toJSON())
    })
  }
}
