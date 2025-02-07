import type { SWPostMessageEvent, SWMessage } from './types'
import { SharedSSEWorker } from '@/defaults/sharedResources'

// Constants
const SSE_TOPIC = 'firehose'

const connections: MessagePort[] = []
let eventSource: EventSource | undefined
let accessToken: string | undefined

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

// @ts-expect-error We don't have types for this
self.onconnect = (initialEvent: MessageEvent) => {
  const port = initialEvent.ports[0]
  connections.push(port)

  port.onmessage = (e: SWPostMessageEvent) => {
    const { type, payload } = e.data
    if (type === 'connect') {
      if (payload.accessToken !== accessToken) {
        broadcastDebugMessage(connections, 'Received SSE connect request with updated token')

        // Close existing connection if we have one
        if (accessToken && eventSource) {
          disconnectSSE(eventSource, connections)
        }

        // Open a new connection if we received an accessToken
        if (payload.accessToken) {
          accessToken = payload.accessToken
          eventSource = connectSSE(payload.url, accessToken, connections)
        }
      }

      if (eventSource) {
        port.postMessage({ type: 'debug', payload: 'SSE connected and listening for events' })
        // broadcastDebugMessage(connections, 'SSE connected and listening for events')
      }
    } else if (type === 'shutdown' && eventSource) {
      broadcastDebugMessage(connections, 'Shutting down sharedSSEWorker')
      disconnectSSE(eventSource, connections)
      eventSource = undefined
      connections.forEach((port) => port.close())
      connections.length = 0
      self.close()
    }
  }

  port.start()

  // @ts-expect-error We don't have types for this
  port.onclose = () => {
    const index = connections.indexOf(port)
    if (index !== -1) connections.splice(index, 1)
  }

  port.postMessage({
    type: 'version',
    payload: SharedSSEWorker.version
  })
}


/**
 * Set up Server-Sent Events (SSE) connection and listen to its events
 */
function connectSSE(baseUrl: string, accessToken: string, connections: MessagePort[]): EventSource {
  const url = new URL(baseUrl)
  url.searchParams.set('topic', SSE_TOPIC)
  url.searchParams.set('token', accessToken)

  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    broadcastMessage(connections, {
      type: 'sse',
      payload: JSON.parse(event.data as string)
    })
  }

  eventSource.onerror = (error) => {
    broadcastDebugMessage(connections, 'SSE Error, closing event listening')
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
  broadcastDebugMessage(connections, 'Stopped listening for Server Sent Events')
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
 * Broadcast to all connected tabs
 */
function broadcastDebugMessage(connections: MessagePort[], msg: string) {
  broadcastMessage(connections, {
    type: 'debug',
    payload: msg
  })
}
