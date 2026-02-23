import type {
  Call,
  Response,
  DocumentUpdate,
  DocumentState,
  DocumentRemoved,
  InclusionDocument,
  InclusionBatch
} from '@ttab/elephant-api/repositorysocket'

import { Timespan } from '@ttab/elephant-api/repository'
import type { DocumentFilter } from '@ttab/elephant-api/repository'
import { Call as CallType, Response as ResponseType } from '@ttab/elephant-api/repositorysocket'
import type { Repository } from './Repository'

interface InclusionDocumentWithUpdater extends InclusionDocument {
  __updater?: {
    sub: string
    time: string
  }
}
/**
 * Document state with included documents from WebSocket API.
 * Base type for documents that may have related documents included.
 */
export interface DocumentStateWithIncludes extends DocumentState {
  __updater?: {
    sub: string
    time: string
  }
  includedDocuments?: InclusionDocumentWithUpdater[]
}
type MessageHandler = (response: Response) => void
type ErrorHandler = (error: Error) => void

export interface SocketStatus {
  level: 'info' | 'warning' | 'error'
  message: string
  error?: Error
}

export class RepositorySocket {
  readonly #url: string
  readonly #repository: Repository
  #ws: WebSocket | null = null
  #authenticated = false
  #messageHandlers = new Map<string, MessageHandler>()
  #rejectHandlers = new Map<string, (error: Error) => void>()
  #updateHandlers = new Set<MessageHandler>()
  #errorHandlers = new Set<ErrorHandler>()
  #reconnectTimer?: number
  #shouldReconnect = true
  #accessToken?: string
  #reconnectListeners = new Set<() => void>()
  #reconnectAttempts = 0
  #connectingPromise: Promise<void> | null = null
  #authenticatingPromise: Promise<void> | null = null
  #statusListeners = new Set<(status: SocketStatus | null) => void>()

  constructor(url: string, repository: Repository) {
    this.#url = url
    this.#repository = repository
  }

  async connect(accessToken: string): Promise<void> {
    if (this.isConnected) return

    if (this.#connectingPromise) {
      return this.#connectingPromise
    }

    this.#shouldReconnect = true

    this.#connectingPromise = this.#initiateConnect(accessToken)
      .finally(() => { this.#connectingPromise = null })

    return this.#connectingPromise
  }

  async #initiateConnect(accessToken: string): Promise<void> {
    this.#accessToken = accessToken
    const token = await this.#getSocketToken(accessToken)
    const urlWithToken = `${this.#url}/${token}`

    return new Promise((resolve, reject) => {
      let settled = false

      try {
        this.#ws = new WebSocket(urlWithToken)
        this.#ws.binaryType = 'arraybuffer'

        this.#ws.onopen = () => {
          this.#emitStatus(null)
          settled = true
          this.#authenticated = false
          resolve()
        }

        this.#ws.onmessage = (event: MessageEvent) => {
          try {
            const data = new Uint8Array(event.data as ArrayBuffer)
            const response = ResponseType.fromBinary(data)

            const handler = this.#messageHandlers.get(response.callId)
            if (handler) {
              handler(response)
            } else {
              // Broadcast to all update handlers
              for (const updateHandler of this.#updateHandlers) {
                updateHandler(response)
              }
            }
          } catch (error) {
            this.#emitStatus({
              level: 'error',
              message: 'Kunde inte läsa meddelande från servern.',
              error: error instanceof Error ? error : new Error(String(error))
            })
          }
        }

        this.#ws.onerror = () => {
          const error = new Error('Ett fel inträffade i anslutningen.')
          this.#emitStatus({ level: 'error', message: error.message, error })
          for (const handler of this.#errorHandlers) {
            handler(error)
          }

          if (!settled) {
            settled = true
            reject(error)
          }
        }

        this.#ws.onclose = (event) => {
          // Ignore Going away
          if (event.code !== 1001) {
            this.#emitStatus({ level: 'warning', message: `Anslutningen stängdes : ${event.code}` })
          }

          this.#authenticated = false
          this.#authenticatingPromise = null

          this.#rejectPendingHandlers('WebSocket connection closed')

          if (!settled) {
            settled = true
            reject(new Error(`WebSocket closed: ${event.code} ${event.reason}`))
          }

          if (this.#shouldReconnect && !event.wasClean) {
            this.#reconnect()
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          reject(error)
        } else {
          reject(new Error('WebSocket connection failed'))
        }
      }
    })
  }

  async #getSocketToken(accessToken: string): Promise<string> {
    return await this.#repository.getSocketToken(accessToken)
  }

  #rejectPendingHandlers(reason: string): void {
    const error = new Error(reason)
    for (const reject of this.#rejectHandlers.values()) {
      reject(error)
    }
    this.#rejectHandlers.clear()
    this.#messageHandlers.clear()
  }

  #reconnect(): void {
    const accessToken = this.#accessToken

    if (!accessToken) {
      this.#emitStatus({ level: 'error', message: 'Accesstoken saknas, kan inte ansluta.' })
      this.#setReconnectTimer(undefined)
      return
    }

    if (this.#reconnectTimer) {
      return
    }

    const maxAttempts = 10
    if (this.#reconnectAttempts >= maxAttempts) {
      this.#emitStatus({ level: 'error', message: `Max antal återanslutningsförsök (${maxAttempts}) nåddes.` })
      return
    }

    const baseDelay = 1000
    const maxDelay = 30000
    const delay = Math.min(
      baseDelay * 2 ** this.#reconnectAttempts, maxDelay
    ) + Math.random() * 1000

    this.#reconnectAttempts++

    this.#setReconnectTimer(window.setTimeout(() => {
      void (async () => {
        try {
          await this.connect(accessToken)
          await this.authenticate()
          this.#reconnectAttempts = 0
          this.#setReconnectTimer(undefined)
          for (const listener of this.#reconnectListeners) {
            listener()
          }
        } catch (error) {
          this.#emitStatus({ level: 'error', message: 'Kunde inte återansluta.', error: error instanceof Error ? error : new Error(String(error)) })
          this.#setReconnectTimer(undefined)
          this.#reconnect()
        }
      })()
    }, delay))
  }

  #setReconnectTimer(timer: number | undefined): void {
    const was = !!this.#reconnectTimer
    if (this.#reconnectTimer && timer === undefined) {
      clearTimeout(this.#reconnectTimer)
    }
    this.#reconnectTimer = timer
    if (was !== !!timer) {
      this.#emitStatus(timer
        ? { level: 'info', message: 'Återansluter... ' }
        : null
      )
    }
  }

  disconnect(): void {
    this.#shouldReconnect = false
    this.#reconnectAttempts = 0
    this.#setReconnectTimer(undefined)
    this.#rejectPendingHandlers('WebSocket disconnected')
    this.#connectingPromise = null
    this.#authenticatingPromise = null
    this.#updateHandlers.clear()
    this.#errorHandlers.clear()
    this.#reconnectListeners.clear()
    this.#statusListeners.clear()
    this.#ws?.close()
    this.#ws = null
  }

  onReconnect(listener: () => void): () => void {
    this.#reconnectListeners.add(listener)
    return () => {
      this.#reconnectListeners.delete(listener)
    }
  }

  onStatusChange(listener: (status: SocketStatus | null) => void): () => void {
    this.#statusListeners.add(listener)
    return () => {
      this.#statusListeners.delete(listener)
    }
  }

  #emitStatus(status: SocketStatus | null): void {
    for (const listener of this.#statusListeners) {
      listener(status)
    }
  }

  async authenticate(): Promise<void> {
    if (this.#authenticated) return

    if (this.#authenticatingPromise) {
      return this.#authenticatingPromise
    }

    this.#authenticatingPromise = this.#initiateAuthenticate()
      .finally(() => { this.#authenticatingPromise = null })

    return this.#authenticatingPromise
  }

  async #initiateAuthenticate(): Promise<void> {
    const token = this.#accessToken

    if (!token) {
      throw new Error('Authentication failed: no access token available')
    }

    const callId = this.#generateCallId()

    const call = CallType.create({
      callId,
      authenticate: { token }
    })

    return new Promise((resolve, reject) => {
      this.#rejectHandlers.set(callId, reject)

      this.#messageHandlers.set(callId, (response) => {
        this.#messageHandlers.delete(callId)
        this.#rejectHandlers.delete(callId)

        if (response.error?.errorMessage) {
          reject(new Error(response.error.errorMessage))
        } else if (response.error) {
          reject(new Error('Authentication failed'))
        } else {
          this.#authenticated = true
          resolve()
        }
      })

      this.#send(call)
    })
  }


  async getDocuments({
    setName,
    type,
    timespan,
    include = [],
    labels = [],
    filter,
    resolveParentIndex
  }: {
    setName: string
    type: string
    timespan?: { from: string, to: string }
    include?: string[]
    labels?: string[]
    filter?: DocumentFilter
    resolveParentIndex?: (documents: DocumentStateWithIncludes[], targetUuid: string) => number
  }): Promise<{
    callId: string
    documents: DocumentStateWithIncludes[]
    onUpdate: (handler: (update: DocumentUpdate | DocumentRemoved | InclusionBatch) => void) => () => void
  }> {
    if (!this.#authenticated) {
      throw new Error('Not authenticated')
    }

    const callId = this.#generateCallId()
    const documents: DocumentStateWithIncludes[] = []

    const call = CallType.create({
      callId,
      getDocuments: {
        setName,
        type,
        labels,
        timespan: timespan ? Timespan.create(timespan) : undefined,
        filter,
        include,
        includeAcls: true
      }
    })

    return new Promise((resolve, reject) => {
      this.#rejectHandlers.set(callId, reject)

      this.#messageHandlers.set(callId, (response) => {
        if (response.error?.errorMessage) {
          this.#messageHandlers.delete(callId)
          this.#rejectHandlers.delete(callId)
          reject(new Error(response.error.errorMessage))
          return
        } else if (response.error) {
          this.#messageHandlers.delete(callId)
          this.#rejectHandlers.delete(callId)
          reject(new Error('Failed to get documents'))
          return
        }

        if (response.documentBatch) {
          documents.push(...response.documentBatch.documents)
        }

        if (response.inclusionBatch && resolveParentIndex) {
          for (const includedDoc of response.inclusionBatch.documents) {
            const targetUuid = includedDoc.state?.document?.uuid
            if (!targetUuid) continue

            const index = resolveParentIndex(documents, targetUuid)
            if (index >= 0) {
              if (!documents[index].includedDocuments) {
                documents[index].includedDocuments = []
              }

              documents[index].includedDocuments.push(includedDoc)
            }
          }
        }

        if (response.handled) {
          this.#messageHandlers.delete(callId)
          this.#rejectHandlers.delete(callId)

          const onUpdate = (handler: (update: DocumentUpdate | DocumentRemoved | InclusionBatch) => void) => {
            const updateHandler: MessageHandler = (response) => {
              // Only handle updates matching this call_id
              if (response.callId !== callId) {
                return
              }

              if (response.documentUpdate) {
                handler(response.documentUpdate)
              } else if (response.inclusionBatch) {
                handler(response.inclusionBatch)
              } else if (response.removed) {
                handler(response.removed)
              }
            }

            this.#updateHandlers.add(updateHandler)

            return () => {
              this.#updateHandlers.delete(updateHandler)
            }
          }

          resolve({ callId, documents, onUpdate })
        }
      })

      this.#send(call)
    })
  }

  async closeDocumentSet(setName: string): Promise<void> {
    if (!this.#authenticated) {
      return
    }

    const callId = this.#generateCallId()

    const call = CallType.create({
      callId,
      closeDocumentSet: { setName }
    })

    return new Promise((resolve, reject) => {
      this.#rejectHandlers.set(callId, reject)

      this.#messageHandlers.set(callId, (response) => {
        this.#messageHandlers.delete(callId)
        this.#rejectHandlers.delete(callId)

        if (response.error?.errorMessage) {
          reject(new Error(response.error.errorMessage))
        } else if (response.error) {
          reject(new Error('Failed to close document set'))
        } else {
          resolve()
        }
      })

      this.#send(call)
    })
  }

  onError(handler: ErrorHandler): () => void {
    this.#errorHandlers.add(handler)
    return () => {
      this.#errorHandlers.delete(handler)
    }
  }

  #send(call: Call): void {
    if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const binary = CallType.toBinary(call)
    this.#ws.send(binary)
  }

  #generateCallId(): string {
    return crypto.randomUUID()
  }

  updateAccessToken(accessToken: string): void {
    this.#accessToken = accessToken
  }

  get isConnected(): boolean {
    return this.#ws?.readyState === WebSocket.OPEN
  }

  get isAuthenticated(): boolean {
    return this.#authenticated
  }
}
