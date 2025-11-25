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
  visibility: Record<string, boolean>
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
}

interface EleConnectedPayload extends connectedPayload {
  context: EleContext
}

/**
 * TrackedDocuments extension for Hocuspocus
 *
 * Tracks which documents are open and which users have them open. Users
 * are added as invisible by default. The client must then send a stateless
 * message to make them visible. The tracker tracks the combination of
 * socket id and hocuspocus server id. This allows the user to have multiple
 * connections to the same document in many different browser tabs.
 *
 * Visibility is not a flag. It is tracked by a document usage id per socketid
 * and hocuspocus server id combination. Each time a document is opened,
 * regardless of whether it was already open or not, the usage receives a "usageId"
 * which then is toggled as invisible or visible. This allows the user to have
 * multiple uses of the same document through the same hocuspocus provider and
 * still manage their visibility independently.
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
    await this.#addConnection(socketId, documentName, sub, name, email)
  }

  async #addConnection(socketId: string, documentName: string, sub: string, name: string, email: string | undefined) {
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
        visibility: {},
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

  /**
   * Message handler to receive user visibility mode.
   */
  async onStateless({ payload, connection }: onStatelessPayload): Promise<void> {
    if (!payload.startsWith(`${StatelessType.CONTEXT}@`) || !this.#connection) {
      return
    }

    const context = connection.context as unknown
    if (!isContext(context)) {
      return
    }

    const { message } = parseStateless<StatelessContext>(payload)

    if (!message.usageId) {
      return
    }

    await this.#setConnectionVisibility(
      message.id,
      connection.socketId,
      message.usageId,
      message.visibility
    )
  }

  async #setConnectionVisibility(documentName: string, socketId: string, usageId: string, visibility: boolean | undefined) {
    if (!this.#connection) {
      return
    }

    await this.#connection.transact((doc) => {
      const documents = doc.getMap<Y.Array<UserConnection>>(this.#mapName)
      const connections = documents.get(documentName)

      if (!connections) {
        return
      }

      // Find the connection and apply the visibility change
      for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections.get(i)
        if (conn.instanceId === this.#instanceId && conn.socketId === socketId) {
          const updatedConn: UserConnection = { ...conn }

          if (visibility === true) {
            updatedConn.visibility[usageId] = visibility
          } else {
            delete updatedConn.visibility[usageId]
          }
          connections.delete(i)
          connections.insert(i, [updatedConn])
          break
        }
      }
    })
  }
}
