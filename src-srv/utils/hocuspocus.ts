import type { Hocuspocus } from '@hocuspocus/server'
import { Server } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'
import type { RedisCache } from './RedisCache.ts'

interface CreateServerOptions {
  cache: RedisCache
}

export async function createServer(options: CreateServerOptions): Promise<Hocuspocus> {
  const { cache } = options

  const server = Server.configure({
    port: parseInt(process.env.API_PORT),
    extensions: [
      new Logger(),
      new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      }),
      new Database({
        fetch: async (data) => {
          // FIXME: This exists in local redis only, crash otherwise
          // documentName '7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe'
          const uint8array = await cache.get(data.documentName)

          if (uint8array) {
            return uint8array
          }

          // TODO: Fetch from repo (or even create new document)
        },
        store: async ({ documentName, state }) => {
          if (!await cache.store(documentName, state)) {
            console.error(`Failed storing ${documentName} in cache`)
          }
        }
      })
    ],
    onAuthenticate: async (data) => {
      // TODO: Authenticate/authorize
      const { token } = data

      return {
        token,
        user: {
          name: 'Danne Lundqvist'
        }
      }
    }
  })

  return server
}
