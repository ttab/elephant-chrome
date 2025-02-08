import type { EventlogItem } from '@ttab/elephant-api/repository'

interface ISharedMessage<T, P> {
  type: T
  payload: P
}

// Receivable messages
export type ConnectMessage = ISharedMessage<'connect', {
  version: number
  accessToken: string
  url: string
}>

export type AccessTokenMessage = ISharedMessage<'accessToken', {
  accessToken: string
}>

// Messages to clients
export type ConnectedMessage = ISharedMessage<'connected', {
  version: number
}>
export type NotConnectedMessage = ISharedMessage<'notconnected', {
  version: number
}>
export type DebugMessage = ISharedMessage<'debug', {
  message: string
  clients: number
}>
export type SSEMessage = ISharedMessage<'sse', EventlogItem>

// Messages in both directions
export type UpgradeMessage = ISharedMessage<'upgrade', {
  version: number
}>

type SharedWorkerMessage = ConnectMessage
  | UpgradeMessage
  | AccessTokenMessage
  | ConnectedMessage
  | NotConnectedMessage
  | DebugMessage
  | SSEMessage

export interface SharedWorkerEvent extends MessageEvent {
  data: SharedWorkerMessage
}

// TODO: Will be done with the refactor of IndexedDB access
//
// FIXME: Start reading event from last event read
// const { lastEventId } = await IDB.get<{ lastEventId: string }>('__meta', 'repositoryEvents') || {}
// if (lastEventId) {
//   headers['Last-Event-ID'] = lastEventId
// }
//
// FIXME: Store last read event
// void IDB.put('__meta', {
//   id: 'repositoryEvents',
//   lastEventId: msg.id,
//   timestamp: msg.timestamp
// })

export class SharedWorker {
  static instance: SharedWorker
  #version: number = 0
  #connections: MessagePort[] = []
  #eventSource?: EventSource
  #url?: URL
  #accessToken?: string

  private constructor() { }

  /**
   * Instatiate or retrieve existing object
   */
  static getInstance(): SharedWorker {
    if (!SharedWorker.instance) {
      SharedWorker.instance = new SharedWorker()
    }

    return SharedWorker.instance
  }

  /**
   * Add a new client
   */
  addClient(port: MessagePort) {
    this.#connections.push(port)

    port.onmessage = (e: SharedWorkerEvent) => {
      switch (e.data.type) {
        case 'upgrade':
          this.#onUpgrade(e.data)
          break

        case 'connect':
          this.#onConnect(e.data)
          this.#broadcast({
            type: 'connected',
            payload: {
              version: this.#version
            }
          })
          break

        case 'accessToken':
          this.#onAccessToken(e.data)
          break
      }
    }

    port.start()

    this.#sendStatusMessage(
      port,
      (this.#eventSource) ? 'connected' : 'notconnected'
    )
  }

  /**
   * Handle connect request from client. This should only
   * come from the first client connecting.
   */
  #onConnect(msg: ConnectMessage) {
    if (this.#eventSource) {
      return
    }

    const { url: baseUrl, accessToken, version } = msg.payload
    const url = new URL(baseUrl)
    url.searchParams.set('topic', 'firehose')
    url.searchParams.set('token', accessToken)
    this.#url = url

    this.#version = version
    this.#accessToken = accessToken
    this.#connectSSE()
  }

  /**
   * Handle new accessToken request from client
   */
  #onAccessToken(msg: AccessTokenMessage) {
    const accessToken = msg.payload.accessToken

    if (!accessToken || accessToken === this.#accessToken || !this.#url) {
      return
    }

    this.#disconnectSSE()
    this.#accessToken = accessToken
    this.#url.searchParams.set('token', accessToken)
    this.#connectSSE()
  }

  /**
   * Close down event listening, notify clients to upgrade and close
   * connections to them all. Important to close and release all resources
   * or upgrades don't work well.
   */
  #onUpgrade(msg: UpgradeMessage) {
    this.#disconnectSSE()
    this.#broadcast({
      type: 'upgrade',
      payload: {
        version: msg.payload.version
      }
    }, true)

    self.close()
    this.#connections.length = 0
  }

  /**
   * Disconnect from event source
   */
  #disconnectSSE() {
    if (!this.#eventSource) {
      return
    }

    this.#eventSource.close()
    this.#eventSource = undefined

    this.#broadcastDebug('Disconnected from event source')
  }

  /**
   * Connect to the event source
   */
  #connectSSE() {
    if (!this.#url) {
      return
    }

    this.#eventSource = new EventSource(this.#url.toString())

    this.#broadcastDebug('Connected to event source')

    this.#eventSource.onmessage = (event) => {
      this.#broadcast({
        type: 'sse',
        payload: JSON.parse(event.data as string)
      })
    }

    this.#eventSource.onerror = (_) => {
      this.#broadcastDebug('Eventsource error caught')
      this.#disconnectSSE()
      this.#connectSSE()
    }
  }

  /**
   * Broadcast a message to all connected clients, set closePorts to true
   * if this should be the last message to the clients
   */
  #broadcast(msg: SharedWorkerMessage, closePorts: boolean = false) {
    this.#connections.forEach((port) => {
      port.postMessage(msg)
    })

    if (!closePorts) {
      return
    }

    this.#connections.forEach((port) => {
      if (closePorts) {
        port.close()
      }
    })
  }



  /**
   * Broadcast a message to all connected clients
   */
  #broadcastDebug(message: string) {
    this.#connections.forEach((port) => {
      port.postMessage({
        type: 'debug',
        payload: {
          message,
          clients: this.#connections.length
        }
      })
    })
  }

  /**
   * Send status message to specific port
   */
  #sendStatusMessage(port: MessagePort, type: 'connected' | 'notconnected' | 'upgrade') {
    port.postMessage({
      type,
      payload: {
        version: this.#version
      }
    })
  }
}
