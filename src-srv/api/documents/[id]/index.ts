import type { WebsocketRequestHandler } from 'express-ws'
import { Server } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
// import { Database } from '@hocuspocus/extension-database'

export const WEB_SOCKET: WebsocketRequestHandler = (ws, req) => {
  const server = Server.configure({
    port: parseInt(process.env.API_PORT),
    extensions: [
      new Logger(),
      new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      })//,
      // new Database({
      //   fetch: async (data) => {
      //     // TODO: Implement
      //     // return await exampleYJSDocument()
      //   },
      //   store: async ({ documentName, state }) => {
      //     // TODO: Implement
      //   }
      // })
    ]
  })

  server.handleConnection(ws, req)
}


// async function exampleYJSDocument(): Promise<object> {
//   return await Promise.resolve([
//     {
//       type: 'core/text',
//       id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
//       class: 'text',
//       properties: {
//         type: 'h1'
//       },
//       children: [
//         { text: 'Better music?' }
//       ]
//     },
//     {
//       type: 'core/text',
//       id: '538345e5-bacc-48f9-9ed2-b219892b51dc',
//       class: 'text',
//       properties: {
//         type: 'preamble'
//       },
//       children: [
//         { text: 'It is one of those days when better music makes all the difference in the world. At least to me, my inner and imaginary friend.' }
//       ]
//     }
//   ])
// }
