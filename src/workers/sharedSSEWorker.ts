import type { SWPostMessageEvent, SWMessage, SWConnectMessage, SWReloadMessage } from './types'
import { SharedSSEWorker } from '@/defaults/sharedResources'

// Constants
const SSE_TOPIC = 'firehose'

const sharedConnections: MessagePort[] = []
let sharedEventSource: EventSource | undefined
let sharedAccessToken: string | undefined

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
  sharedConnections.push(port)

  port.onmessage = (e: SWPostMessageEvent) => {
    switch (e.data.type) {
      case 'connect':
        onConnect(port, e.data)
        break

      case 'reload':
        onReloadRequest(e.data)
        break
    }
  }

  port.start()

  // FIXME: This never fires and the connected clients just grow and grow and grow...
  // port.onclose = () => {
  //   const index = sharedConnections.indexOf(port)
  //   if (index !== -1) {
  //     sharedConnections.splice(index, 1)
  //   }
  // }

  port.postMessage({
    type: 'connected',
    payload: SharedSSEWorker.version
  })
}

/**
 * Setup connection or reinitalize connection
 */
function onConnect(port: MessagePort, msg: SWConnectMessage) {
  const { payload } = msg

  if (payload.accessToken !== sharedAccessToken) {
    broadcastDebugMessage('Received SSE connect request with updated token')

    // Close existing connection if we have one
    if (sharedAccessToken && sharedEventSource) {
      disconnectSSE()
    }

    // Open a new connection if we received an accessToken
    if (payload.accessToken) {
      sharedAccessToken = payload.accessToken
      sharedEventSource = connectSSE(payload.url, sharedAccessToken)
    }
  }

  if (sharedEventSource) {
    port.postMessage({ type: 'debug', payload: `SSE connected, ${sharedConnections.length} clients listening for events` })
  }
}


/**
 * Handle reload request
 */
function onReloadRequest(msg: SWReloadMessage) {
  if (sharedEventSource) {
    broadcastDebugMessage(`Shutting down sharedSSEWorker version ${SharedSSEWorker.version}`)
    disconnectSSE()
  }

  // Tell all connected clients to reload the worker with the specified version
  sharedConnections.forEach((port) => {
    port.postMessage(msg)
    port.close()
  })

  sharedConnections.length = 0
  self.close()
}


/**
 * Set up Server-Sent Events (SSE) connection and listen to its events
 */
function connectSSE(baseUrl: string, accessToken: string): EventSource {
  const url = new URL(baseUrl)
  url.searchParams.set('topic', SSE_TOPIC)
  url.searchParams.set('token', accessToken)

  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    broadcastMessage({
      type: 'sse',
      payload: JSON.parse(event.data as string)
    })
  }

  eventSource.onerror = (_) => {
    broadcastDebugMessage('Error listening for server sent events')
    disconnectSSE()
  }

  return eventSource
}


/**
 * Close current EventSource connection
 */
function disconnectSSE() {
  if (!sharedEventSource) {
    return
  }

  broadcastDebugMessage('Shutting down listener for server sent events')
  sharedEventSource.close()
  sharedEventSource = undefined
}


/**
 * Broadcast to all connected tabs
 */
function broadcastMessage(msg: SWMessage) {
  sharedConnections.forEach((port) => {
    port.postMessage(msg)
  })
}

/**
 * Broadcast to all connected tabs
 */
function broadcastDebugMessage(msg: string) {
  broadcastMessage({
    type: 'debug',
    payload: msg
  })
}
