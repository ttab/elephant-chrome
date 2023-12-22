import type { Hocuspocus } from '@hocuspocus/server'
import { Server } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'
import type { RedisCache } from './RedisCache.js'
import type { Repository } from './Repository.js'
import { decodeJwt } from 'jose'
import { initDoc } from './transformations/index.js'

interface CreateServerOptions {
  repository: Repository
  cache: RedisCache
}

export async function createServer(options: CreateServerOptions): Promise<Hocuspocus> {
  const { repository, cache } = options
  const REDIS_URL = process.env.REDIS_URL

  if (!REDIS_URL) {
    throw new Error('Missing REDIS_URL')
  }

  const server = Server.configure({
    port: process.env.PORT ? parseInt(process.env.PORT) : 5183,
    extensions: [
      new Logger(),
      new Redis({
        options: {
          host: REDIS_URL
        }
      }),
      new Database({
        fetch: async (data) => {
          // Try fetching from cache
          const uint8Array = await cache.get(data.documentName)
          if (uint8Array) {
            return uint8Array
          }

          // Fetch document from repository
          const { context, document } = data
          const doc = await repository.getDoc({
            uuid: document.name,
            accessToken: context.token
          })
          return initDoc(doc, data.document)
        },
        store: async ({ documentName, state }) => {
          if (!await cache.store(documentName, state)) {
            console.error(`Failed storing ${documentName} in cache`)
          }
        }
      })
    ],
    onAuthenticate: async (data) => {
      const { token } = data
      return await repository.validateToken(token).then(() => {
        return {
          token,
          user: { ...decodeJwt(token) }
        }
      }).catch(err => {
        throw new Error('Can not authenticate', { cause: err })
      })
    }
  })

  return server
}
