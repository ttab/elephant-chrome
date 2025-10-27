import type { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { CollaborationClient } from './CollaborationClient'
import type * as Y from 'yjs'

export interface CollaborationClientRegistryConfig {
  webSocketProvider: HocuspocusProviderWebsocket
  accessToken: string
}

export interface GetClientOptions {
  document: Y.Doc
  persistent?: boolean
}

/**
 * CollaborationClientRegistry
 * Singleton registry that manages and reuses CollaborationClient instances
 */
export class CollaborationClientRegistry {
  #hpWebsocketProvider: HocuspocusProviderWebsocket
  #accessToken: string
  #clients: Map<string, CollaborationClient> = new Map()

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

      for (const client of this.#clients.values()) {
        client.updateAccessToken(newAccessToken)
      }

      if (this.#clients.size) {
        console.log('🔑 Access token updated for all clients')
      }
    }
  }

  /**
   * Get or create a collaboration client for a document.
   * Reuses existing clients to ensure only one client per document.
   */
  async get(documentName: string, options: GetClientOptions
  ): Promise<CollaborationClient> {
    let client = this.#clients.get(documentName)

    if (client) {
      console.log('♻️ Reusing existing client for:', documentName)
      return client
    }

    client = new CollaborationClient(documentName, {
      accessToken: this.#accessToken,
      hpWebsocketProvider: this.#hpWebsocketProvider,
      document: options.document,
      persistent: options.persistent
    })
    this.#clients.set(documentName, client)
    await client.connect()
    return client
  }

  /**
   * Get a client synchronously (returns undefined if not exists)
   */
  getSync(documentName: string): CollaborationClient | undefined {
    return this.#clients.get(documentName)
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
    const client = this.#clients.get(documentName)

    if (!client) {
      return
    }

    console.log('🗑️ Removing client for:', documentName)

    await client.disconnect()
    this.#clients.delete(documentName)
  }

  /**
   * Disconnect and remove all clients
   */
  async clear(): Promise<void> {
    console.log('🗑️ Clearing all clients...')

    const disconnectPromises = Array.from(this.#clients.values()).map((client) =>
      client.disconnect()
    )

    await Promise.all(disconnectPromises)
    this.#clients.clear()

    console.log('✅ All clients cleared')
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
    return Array.from(this.#clients.values())
  }
}
