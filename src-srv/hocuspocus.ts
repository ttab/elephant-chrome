// import type { WebsocketRequestHandler } from 'express-ws'
// import { Server } from '@hocuspocus/server'
// import { Logger } from '@hocuspocus/extension-logger'
// import { Redis } from '@hocuspocus/extension-redis'
// import { Database } from '@hocuspocus/extension-database'
// import * as uuid from 'uuid'
// import { createClient } from 'redis'


// export const WEB_SOCKET: WebsocketRequestHandler = (ws) => {
//   const redisClient = createClient()

//   console.log(req.params)

//   const server = Server.configure({
//     port: parseInt(process.env.API_PORT),
//     extensions: [
//       new Logger(),
//       new Redis({
//         host: process.env.REDIS_HOST,
//         port: parseInt(process.env.REDIS_PORT)
//       }),
//       new Database({
//         fetch: async (data) => {
//           console.log(data.socketId, data.documentName)
//           const docId = '7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe' // data.documentName
//           const cachedDoc = await redisClient.get(docId)
//           console.log(cachedDoc)
//           if (cachedDoc) {
//             return new Uint8Array(
//               Buffer.from(cachedDoc, 'binary')
//             )
//           }

//           const [newDocStr/* , newDocId */] = await exampleYJSDocument()
//           return new Uint8Array(
//             Buffer.from(newDocStr, 'binary')
//           )
//         },
//         store: async ({ documentName, state }) => {
//           redisClient.set(
//             documentName,
//             Buffer.from(state).toString('binary')
//           ).catch(ex => {
//             console.log(ex)
//           })
//         }
//       })
//     ],
//     onAuthenticate: async (data) => {
//       return {}
//     }
//   })

//   server.handleConnection(ws, req)
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
