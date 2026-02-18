import type { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { IndexeddbPersistence } from 'y-indexeddb'
import type * as Y from 'yjs'

export interface CollaborationClientOptions {
  hpWebsocketProvider: HocuspocusProviderWebsocket
  accessToken: string
  document: Y.Doc
  persistent?: boolean
  cleanupIndexedDB?: boolean
  skipIndexedDB?: boolean
}

export interface CollaborationClientStatus {
  hpOnline: boolean
  hpSynced: boolean
  idbOnline: boolean
  isReady: boolean
}

/**
 * CollaborationClient
 * Manages a single collaborative document with IndexedDB persistence and Hocuspocus sync
 */
export class CollaborationClient {
  #hpWebsocketProvider: HocuspocusProviderWebsocket
  #hp: HocuspocusProvider | null = null
  #hpOnline: boolean = false
  #hpSynced: boolean = false

  #idb: IndexeddbPersistence | null = null
  #idbOnline: boolean = false

  #documentName: string
  #document: Y.Doc
  #accessToken: string
  #persistent: boolean
  #isConnecting: boolean = false
  #isConnected: boolean = false
  #statusChangeListeners: Set<(status: CollaborationClientStatus) => void> = new Set()

  // Whether to cleanup IndexedDB when last client is removed, this does not
  // sync across browser tabs which could lead to data not being persisted locally.
  #cleanupIndexedDB = false
  #skipIndexedDB = false

  constructor(documentName: string, options: CollaborationClientOptions) {
    this.#hpWebsocketProvider = options.hpWebsocketProvider
    this.#accessToken = options.accessToken
    this.#documentName = documentName
    this.#document = options.document
    this.#persistent = options.persistent ?? false
    this.#skipIndexedDB = options.skipIndexedDB ?? false

    console.log('📄 CollaborationClient created for', documentName)
  }

  /**
   * Get Hocuspocus provider instance
   */
  getProvider(): HocuspocusProvider | null {
    return this.#hp
  }

  /**
   * Get the Y.Doc instance
   */
  getDocument(): Y.Doc {
    return this.#document
  }

  /**
   * Get the document name
   */
  getDocumentName(): string {
    return this.#documentName
  }

  /**
   * Get current status
   */
  getStatus(): CollaborationClientStatus {
    return {
      hpOnline: this.#hpOnline,
      hpSynced: this.#hpSynced,
      idbOnline: this.#idbOnline,
      isReady: this.#document.getMap('meta').get('isReady') as boolean ?? false
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: CollaborationClientStatus) => void): () => void {
    this.#statusChangeListeners.add(listener)

    // Notify immediately
    listener(this.getStatus())

    // Return unsubscribe function
    return () => {
      this.#statusChangeListeners.delete(listener)
    }
  }

  #notifyStatusChange(): void {
    const status = this.getStatus()
    this.#statusChangeListeners.forEach((listener) => listener(status))
  }

  /**
   * Update access token and re-authenticate
   */
  updateAccessToken(newAccessToken: string): void {
    this.#accessToken = newAccessToken

    if (this.#hp && this.#isConnected) {
      // Send auth message to re-authenticate
      const msg = `auth@${JSON.stringify({ accessToken: newAccessToken })}`
      this.#hp.sendStateless(msg)
      console.log('🔑 Access token updated for:', this.#documentName)
    }
  }

  /**
   * Connect to IndexedDB and Hocuspocus
   */
  async connect(): Promise<void> {
    if (this.#isConnecting || this.#isConnected) {
      console.log('⏭️ Already connecting or connected:', this.#documentName)
      return
    }

    this.#isConnecting = true

    try {
      // Initialize IndexedDB first (unless skipped)
      if (!this.#skipIndexedDB) {
        await this.#connectIndexedDB()
      }

      // Then initialize Hocuspocus
      this.#connectHocuspocus()

      this.#isConnected = true
    } catch (error) {
      console.error('❌ CollaborationClient connection failed:', error)
      throw error
    } finally {
      this.#isConnecting = false
    }
  }

  async #connectIndexedDB(): Promise<void> {
    this.#idb = new IndexeddbPersistence(this.#documentName, this.#document)

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('IndexedDB connection timeout'))
      }, 3000)
    })

    try {
      await Promise.race([timeoutPromise, this.#idb.whenSynced])
      console.log('📦 Local persistence initialized for', this.#documentName)
      this.#idbOnline = true
      this.#notifyStatusChange()
    } catch (error) {
      console.error('❌ Local persistence failed:', error)
      this.#idbOnline = false
      this.#notifyStatusChange()
      throw error
    }
  }

  #connectHocuspocus() {
    console.log('⏳ Connecting to Hocuspocus server...')

    this.#hp = new HocuspocusProvider({
      websocketProvider: this.#hpWebsocketProvider,
      name: this.#documentName,
      document: this.#document,
      token: this.#accessToken,
      onAuthenticated: () => {
        console.log('🔐 HP authenticated:', this.#documentName)
      },
      onAuthenticationFailed: () => {
        console.log('🔒 HP authentication failed:', this.#documentName)
        this.#hpOnline = false
        this.#notifyStatusChange()
      },
      onConnect: () => {
        console.log('🔗 HP connected:', this.#documentName)
        this.#hpOnline = true
        this.#notifyStatusChange()
      },
      onDisconnect: () => {
        console.log('🔌 HP disconnected:', this.#documentName)
        this.#hpOnline = false
        this.#notifyStatusChange()
      },
      onSynced: ({ state }) => {
        console.log('🔄 HP initially synced:', this.#documentName, state)
        this.#hpSynced = state
        if (this.#hpSynced) {
          // If initial sync is successful, we assume the client is online
          this.#hpOnline = true
        }
        this.#notifyStatusChange()
      },
      onUnsyncedChanges: ({ number }) => {
        if (number > 0 && this.#hpSynced) {
          this.#hpSynced = false
          this.#notifyStatusChange()
        } else if (number === 0 && !this.#hpSynced) {
          console.log('🔄 HP synced:', this.#documentName)
          this.#hpSynced = true
          this.#notifyStatusChange()
        }
      }
    })

    this.#hp.attach()

    if (this.#hpWebsocketProvider.webSocket?.readyState === WebSocket.OPEN) {
      console.log('🔌 Using existing open WebSocket connection')
    }
  }

  /**
   * Disconnect and clean up
   */
  async disconnect(): Promise<void> {
    if (!this.#isConnected) {
      return
    }

    console.log('🔌 Disconnecting CollaborationClient:', this.#documentName)

    // Clean up IndexedDB if not persistent
    if (this.#idb) {
      if (!this.#persistent && this.#hp?.hasUnsyncedChanges === false && this.#cleanupIndexedDB) {
        // CAVEAT: Can remove data that a provider in another tab is syncing to
        await this.#idb.clearData()
        console.log('🗑️ IndexedDB data cleared for:', this.#documentName)
      }

      await this.#idb.destroy()
      this.#idb = null
    }

    // Detach and destroy Hocuspocus provider
    if (this.#hp) {
      this.#hp.detach()
      this.#hp.destroy()
      this.#hp = null
    }

    this.#isConnected = false
    this.#hpOnline = false
    this.#hpSynced = false
    this.#idbOnline = false
    this.#notifyStatusChange()

    console.log('✅ CollaborationClient disconnected:', this.#documentName)
  }

  /**
   * Perform a transaction on the document
   */
  transact<T>(fn: (map: Y.Map<T>, transaction: Y.Transaction) => void): void {
    this.#document.transact((tr) => {
      const map = this.#document.getMap<T>('document')
      fn(map, tr)
    })
  }

  /**
   * Send a stateless message
   */
  send(key: string, payload: unknown): void {
    if (!this.#hp) {
      console.warn('Cannot send message, Hocuspocus not connected')
      return
    }

    const msg = `${key}@${JSON.stringify(payload)}`
    this.#hp.sendStateless(msg)
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.#isConnected
  }

  /**
   * Check if synced
   */
  isSynced(): boolean {
    return this.#hpSynced && this.#idbOnline
  }
}
