import {
  HocuspocusProviderWebsocket, type HocuspocusProviderWebsocketConfiguration
} from '@hocuspocus/provider'
import { type Hocuspocus } from '@hocuspocus/server'

export const newHocuspocusProviderWebsocket = (
  server: Hocuspocus,
  options: Partial<Omit<HocuspocusProviderWebsocketConfiguration, 'url'>> = {}
): HocuspocusProviderWebsocket => {
  return new HocuspocusProviderWebsocket({
    // we can get the URL from the passed server instance.
    url: server.server?.webSocketURL || 'localhost',
    // Pass a polyfill to use WebSockets in a Node.js environment.
    WebSocketPolyfill: WebSocket,
    ...options
  })
}
