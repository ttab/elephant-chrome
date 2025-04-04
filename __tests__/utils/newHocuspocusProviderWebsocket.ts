import {
  HocuspocusProviderWebsocket, type HocuspocusProviderWebsocketConfiguration
} from '@hocuspocus/provider'
import { type Hocuspocus } from '@hocuspocus/server'

export const newHocuspocusProviderWebsocket = (
  server: Hocuspocus,
  options: Partial<Omit<HocuspocusProviderWebsocketConfiguration, 'url'>> = {}
): HocuspocusProviderWebsocket => {
  return new HocuspocusProviderWebsocket({
    // We don’t need which port the server is running on, but
    // we can get the URL from the passed server instance.
    url: server.webSocketURL,
    // Pass a polyfill to use WebSockets in a Node.js environment.
    WebSocketPolyfill: WebSocket,
    ...options
  })
}
