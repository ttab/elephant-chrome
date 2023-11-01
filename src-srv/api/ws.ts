// import type { WebsocketRequestHandler } from 'express-ws'
// import { Server } from '@hocuspocus/server'
// import { Logger } from '@hocuspocus/extension-logger'
// import { Redis } from '@hocuspocus/extension-redis'
// import { Database } from '@hocuspocus/extension-database'
// import * as uuid from 'uuid'
// import { createClient } from 'redis'

// export const WEB_SOCKET: WebsocketRequestHandler = (ws, req) => {
//   console.log('Entering ws.ts')
//   console.log(ws)
//   console.log(server.URL)
//   server.handleConnection(ws, req)
//   server.getMessageLogs().map(console.log)
// }


// async function exampleYJSDocument(): Promise<[string, string]> {
//   const docStr = JSON.stringify([
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

//   const docId = uuid.v5('538345e5-bacc-48f9-8ef1-a219891b60eb', docStr)

//   return await Promise.resolve([docStr, docId])
// }
