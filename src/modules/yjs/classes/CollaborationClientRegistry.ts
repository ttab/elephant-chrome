import type { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { CollaborationClient } from './CollaborationClient'
import type * as Y from 'yjs'
import { isValidUUID } from '@/shared/isValidUUID'

export interface CollaborationClientRegistryConfig {
  webSocketProvider: HocuspocusProviderWebsocket
  accessToken: string
  cleanupIndexedDB?: boolean
}

export interface GetClientOptions {
  document: Y.Doc
  persistent?: boolean
}

interface ClientEntry {
  client: CollaborationClient
  refCount: number
  cleanupTimer?: ReturnType<typeof setTimeout>
}

/**
 * CollaborationClientRegistry
 * Singleton registry that manages and reuses CollaborationClient instances
 */
export class CollaborationClientRegistry {
  #hpWebsocketProvider: HocuspocusProviderWebsocket
  #accessToken: string
  #clients: Map<string, ClientEntry> = new Map()

  // 30 seconds after last component unmounts
  #cleanupDelay: number = 30000

  // Whether to cleanup IndexedDB when last client is removed, this does not
  // sync across browser tabs which could lead to data not being persisted locally.
  #cleanupIndexedDB: boolean = false

  constructor(config: CollaborationClientRegistryConfig) {
    this.#accessToken = config.accessToken
    this.#hpWebsocketProvider = config.webSocketProvider
  }

  /**
   * Update access token for all clients
   */
  updateAccessToken(newAccessToken: string): void {
    if (newAccessToken !== this.#accessToken) {
      this.#accessToken = newAccessToken

      for (const entry of this.#clients.values()) {
        entry.client.updateAccessToken(newAccessToken)
      }

      if (this.#clients.size) {
        console.info('🔑 Access token updated for all clients')
      }
    }
  }

  /**
   * Get or create a collaboration client for a document.
   * Reuses existing clients to ensure only one client per document.
   */
  async get(documentName: string, options: GetClientOptions
  ): Promise<CollaborationClient> {
    const entry = this.#clients.get(documentName)

    if (entry) {
      // Cancel any pending cleanup
      if (entry.cleanupTimer) {
        clearTimeout(entry.cleanupTimer)
        entry.cleanupTimer = undefined
        console.info('⏸️  Cleanup cancelled for:', documentName)
      }

      entry.refCount++
      console.info(`♻️  Reusing client for: ${documentName} (refs: ${entry.refCount})`)
      return entry.client
    }

    console.info('🆕 Creating new client for:', documentName)

    const client = new CollaborationClient(documentName, {
      accessToken: this.#accessToken,
      hpWebsocketProvider: this.#hpWebsocketProvider,
      document: options.document,
      persistent: options.persistent,
      cleanupIndexedDB: this.#cleanupIndexedDB
    })

    this.#clients.set(documentName, {
      client,
      refCount: 1
    })

    await client.connect()
    return client
  }

  /**
   * Release a reference to a client. When refCount reaches 0,
   * schedules cleanup after a delay.
   */
  release(documentName: string): void {
    const entry = this.#clients.get(documentName)
    if (!entry) {
      console.warn(`⚠️ Attempted to release unknown client: ${documentName}`)
      return
    }

    entry.refCount--
    console.info(`📉 Released client: ${documentName} (refs: ${entry.refCount})`)

    if (entry.refCount <= 0) {
      // Schedule cleanup after delay
      console.info(`⏲️ Scheduling cleanup for: ${documentName} in ${this.#cleanupDelay}ms`)
      entry.cleanupTimer = setTimeout(() => {
        void this.#cleanup(documentName)
      }, this.#cleanupDelay)
    }
  }

  /**
   * Internal cleanup method
   */
  async #cleanup(documentName: string): Promise<void> {
    const entry = this.#clients.get(documentName)
    if (!entry) return

    // Double-check refCount in case it was incremented during the delay
    if (entry.refCount > 0) {
      console.info(`⏭️ Canceling cleanup for ${documentName} - still in use (refs: ${entry.refCount})`)
      return
    }

    console.info('🗑️ Cleaning up unused client:', documentName)
    await entry.client.disconnect()
    this.#clients.delete(documentName)
  }

  /**
   * Get a client synchronously (returns undefined if not exists)
   */
  getSync(documentName: string): CollaborationClient | undefined {
    return this.#clients.get(documentName)?.client
  }

  /**
   * Check if a client exists
   */
  has(documentName: string): boolean {
    return this.#clients.has(documentName)
  }

  /**
   * Disconnect and remove a specific client
   */
  async remove(documentName: string): Promise<void> {
    const entry = this.#clients.get(documentName)
    if (!entry) {
      return
    }

    console.info('🗑️ Removing client for:', documentName)

    await entry.client.disconnect()
    this.#clients.delete(documentName)
  }

  /**
   * Disconnect and remove all clients
   */
  async clear(): Promise<void> {
    console.info('🗑️ Clearing all clients...')

    for (const entry of this.#clients.values()) {
      if (entry.cleanupTimer) {
        clearTimeout(entry.cleanupTimer)
      }
    }
    const disconnectPromises = Array.from(this.#clients.values()).map((entry) =>
      entry.client.disconnect()
    )

    await Promise.all(disconnectPromises)
    this.#clients.clear()

    console.info('✅ All clients cleared')
  }

  /**
   * Get all active client document names
   */
  getDocumentNames(): string[] {
    return Array.from(this.#clients.keys())
  }

  /**
   * Get number of active clients
   */
  size(): number {
    return this.#clients.size
  }

  /**
   * Get all clients
   */
  getAllClients(): CollaborationClient[] {
    return Array.from(this.#clients.values()).map((entry) => entry.client)
  }

  /**
   * Static function to cleanup all local documents in indexedDB
   *
   * FIXME: Implement way of syncing documents w hocuspocus that are not synced previously.
   */
  static async cleanupLocalDocuments(): Promise<void> {
    const { indexedDB: idb } = window

    const dbs = await idb.databases()
    dbs.map(({ name }) => {
      if (isValidUUID(name)) {
        idb.deleteDatabase(name)
      }
    })
  }
}
