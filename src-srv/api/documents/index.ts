import type { Request } from 'express'
// import type { WebsocketRequestHandler } from 'express-ws'

export async function GET(req: Request): Promise<unknown> {
  return {
    payload: []
  }
}

// export const WEB_SOCKET: WebsocketRequestHandler = (ws, req) => {
//   ws.on('message', (msg) => {
//     console.log(msg)
//     ws.send(msg)
//   })
// }
