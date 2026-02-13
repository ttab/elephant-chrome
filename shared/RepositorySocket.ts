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
import { Call as CallType, Response as ResponseType } from '@ttab/elephant-api/repositorysocket'
import type { Repository } from './Repository'
import { getSession } from 'next-auth/react'

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

export class RepositorySocket {
  readonly #url: string
  readonly #repository: Repository
  #ws: WebSocket | null = null
  #authenticated = false
  #messageHandlers = new Map<string, MessageHandler>()
  #updateHandlers = new Set<MessageHandler>()
  #errorHandler?: ErrorHandler
  #reconnectTimer?: number
  #shouldReconnect = true
  #accessToken?: string
  #reconnectListeners = new Set<() => void>()

  constructor(url: string, repository: Repository) {
    this.#url = url
    this.#repository = repository
  }

  async connect(accessToken: string): Promise<void> {
    this.#accessToken = accessToken
    const token = await this.#getSocketToken()
    const urlWithToken = `${this.#url}/${token}`

    return new Promise((resolve, reject) => {
      try {
        this.#ws = new WebSocket(urlWithToken)
        this.#ws.binaryType = 'arraybuffer'

        this.#ws.onopen = () => {
          console.info('📡 RepositorySocket connected')

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
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.#ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          const error = new Error('WebSocket connection error')
          this.#errorHandler?.(error)
          reject(error)
        }

        this.#ws.onclose = (event) => {
          console.info('WebSocket closed:', event.code, event.reason)
          this.#authenticated = false

          // Clear orphaned message handlers from previous connection
          this.#messageHandlers.clear()
          this.#updateHandlers.clear()

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

  async #getSocketToken(): Promise<string> {
    return await this.#repository.getSocketToken()
  }

  #reconnect(): void {
    if (this.#reconnectTimer) {
      return
    }

    if (!this.#accessToken) {
      console.error('Cannot reconnect: no access token available')
      return
    }

    this.#reconnectTimer = window.setTimeout(() => {
      void (async () => {
        this.#reconnectTimer = undefined
        if (!this.#accessToken) {
          console.error('Cannot reconnect: no access token available')
          return
        }

        try {
          await this.connect(this.#accessToken)
          await this.authenticate()
          console.info('✅ Reconnected and authenticated')
          for (const listener of this.#reconnectListeners) {
            listener()
          }
        } catch (error) {
          console.error('Reconnection or authentication failed:', error)
        }
      })()
    }, 5000)
  }

  disconnect(): void {
    this.#shouldReconnect = false
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = undefined
    }
    this.#messageHandlers.clear()
    this.#updateHandlers.clear()
    this.#reconnectListeners.clear()
    this.#ws?.close()
    this.#ws = null
  }

  onReconnect(listener: () => void): () => void {
    this.#reconnectListeners.add(listener)
    return () => {
      this.#reconnectListeners.delete(listener)
    }
  }

  async authenticate(): Promise<void> {
    const session = await getSession()
    const token = session?.accessToken

    if (!token) {
      throw new Error('Authentication failed: no access token available')
    }

    const callId = this.#generateCallId()

    const call = CallType.create({
      callId,
      authenticate: { token }
    })


    return new Promise((resolve, reject) => {
      this.#messageHandlers.set(callId, (response) => {
        this.#messageHandlers.delete(callId)

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
    labels = []
  }: {
    setName: string
    type: string
    timespan?: { from: string, to: string }
    include?: string[]
    labels?: string[]
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
        include,
        includeAcls: true
      }
    })

    return new Promise((resolve, reject) => {
      this.#messageHandlers.set(callId, (response) => {
        if (response.error?.errorMessage) {
          this.#messageHandlers.delete(callId)
          reject(new Error(response.error.errorMessage))
          return
        } else if (response.error) {
          this.#messageHandlers.delete(callId)
          reject(new Error('Failed to get documents'))
          return
        }

        if (response.documentBatch) {
          documents.push(...response.documentBatch.documents)
        }

        if (response.inclusionBatch) {
          // build map of deliverable uuid -> index
          const uuidToIndex = new Map<string, number>()
          documents.forEach((doc, i) => {
            const metas = doc.document?.meta?.filter((a) => a.type === 'core/assignment')
            if (!metas?.length) {
              return
            }

            for (const meta of metas) {
              for (const link of meta.links ?? []) {
                if (link.rel !== 'deliverable' || !link.uuid) {
                  continue
                }

                uuidToIndex.set(link.uuid, i)
              }
            }
          })

          for (const includedDoc of response.inclusionBatch.documents) {
            const targetUuid = includedDoc.state?.document?.uuid
            const index = targetUuid ? uuidToIndex.get(targetUuid) : undefined
            if (index !== undefined) {
              if (!documents[index].includedDocuments) {
                documents[index].includedDocuments = []
              }

              documents[index].includedDocuments.push(includedDoc)
            }
          }
        }

        if (response.handled) {
          this.#messageHandlers.delete(callId)

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
      this.#messageHandlers.set(callId, (response) => {
        this.#messageHandlers.delete(callId)

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

  onError(handler: ErrorHandler): void {
    this.#errorHandler = handler
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

  get isConnected(): boolean {
    return this.#ws?.readyState === WebSocket.OPEN
  }

  get isAuthenticated(): boolean {
    return this.#authenticated
  }
}
