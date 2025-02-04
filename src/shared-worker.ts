const connections: MessagePort[] = []
let eventSource: EventSource
let accessToken: string

interface MessageData {
  type: 'accessToken' | 'debug' | 'sse'
  payload?: unknown
}

interface PostMessageEvent extends MessageEvent {
  data: MessageData
}


self.onconnect = (initialEvent: MessageEvent) => {
  const port = initialEvent.ports[0]
  connections.push(port)

  port.onmessage = (e: PostMessageEvent) => {
    const { type, payload } = e.data

    if (type === 'accessToken' && accessToken !== payload) {
      if (accessToken === payload) {
        return
      }

      if (payload) {
        broadcastMessage(connections, {
          type: 'debug',
          payload: 'Received updated token'
        })
      }

      if (accessToken && eventSource) {
        disconnectSSE(eventSource, connections)
      }

      if (payload) {
        eventSource = connectSSE(payload as string, connections)
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
function broadcastMessage(connections: MessagePort[], msg: MessageData) {
  connections.forEach((conn) => {
    conn.postMessage(msg)
  })
}


/**
 * Set up Server-Sent Events (SSE) connection and listen to its events
 */
function connectSSE(accessToken: string, connections: MessagePort[]): EventSource {
  const eventSource = new EventSource(`https://repository.stage.tt.se/sse?topic=firehose&token=${accessToken}`)
  broadcastMessage(connections, {
    type: 'debug',
    payload: 'Now listening for Server Sent Events'
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
