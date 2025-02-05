import type { EventlogItem } from '@ttab/elephant-api/repository'

const connections: MessagePort[] = []
let eventSource: EventSource
let accessToken: string | undefined

interface SWConnectMessage {
  type: 'connect'
  payload: {
    url: string
    accessToken?: string
  }
}

interface SWDebugMessage {
  type: 'debug'
  payload: string
}

interface SWSSEMessage {
  type: 'sse'
  payload: EventlogItem
}

type SWMessage = SWConnectMessage | SWDebugMessage | SWSSEMessage

interface PostMessageEvent extends MessageEvent {
  data: SWMessage
}


self.onconnect = (initialEvent: MessageEvent) => {
  const port = initialEvent.ports[0]
  connections.push(port)

  port.onmessage = (e: PostMessageEvent) => {
    const { type, payload } = e.data

    if (type === 'connect' && accessToken !== payload.accessToken) {
      broadcastMessage(connections, {
        type: 'debug',
        payload: 'Received SSE connect request with updated token'
      })

      if (accessToken && eventSource) {
        // Close existing connection if we havae one
        disconnectSSE(eventSource, connections)
      }

      if (payload.accessToken) {
        // Open a new connection if we received an accessToken
        accessToken = payload.accessToken

        const url = new URL(payload.url)
        url.searchParams.set('topic', 'firehose')
        url.searchParams.set('token', accessToken)

        eventSource = connectSSE(url.toString(), connections)
      }
    }
  }

  port.start()
  port.onclose = () => {
    const index = connections.indexOf(port)
    if (index !== -1) connections.splice(index, 1)
  }

  port.postMessage({
    type: 'debug',
    payload: 'Connected to shared worker'
  })
}


/**
 * Broadcast to all connected tabs
 */
function broadcastMessage(connections: MessagePort[], msg: SWMessage) {
  connections.forEach((conn) => {
    conn.postMessage(msg)
  })
}


/**
 * Set up Server-Sent Events (SSE) connection and listen to its events
 */
function connectSSE(url: string, connections: MessagePort[]): EventSource {
  const eventSource = new EventSource(url)
  broadcastMessage(connections, {
    type: 'debug',
    payload: 'Connected and listening for Server Sent Events'
  })

  eventSource.onmessage = (event) => {
    broadcastMessage(connections, {
      type: 'sse',
      payload: JSON.parse(event.data)
    })
  }

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error)
    eventSource.close()
  }

  return eventSource
}


/**
 * Close current EventSource connection
 */
function disconnectSSE(eventSource: EventSource, connections: MessagePort[]) {
  eventSource.close()

  broadcastMessage(connections, {
    type: 'debug',
    payload: 'Stopped listening for Server Sent Events'
  })
}
