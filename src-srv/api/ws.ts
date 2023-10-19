import type { WebsocketRequestHandler } from 'express-ws'

export const WEB_SOCKET: WebsocketRequestHandler = (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg)
  })
}
