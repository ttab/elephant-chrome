import {
  Server,
  type Hocuspocus,
  type fetchPayload,
  type storePayload,
  type onAuthenticatePayload
} from '@hocuspocus/server'

import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'
import type { RedisCache } from './RedisCache.js'
import type { Repository } from './Repository.js'
import {
  decodeJwt,
  type JWTPayload
} from 'jose'

import {
  type Application
} from 'express-ws'


import { slateNodesToInsertDelta } from '@slate-yjs/core'
import * as Y from 'yjs'
import {
  newsDocToSlate,
  newsDocToYmap
} from './transformations/index.js'

enum DocumentType {
  ARTICLE = 'core/article',
  PLANNING = 'core/planning-item'
}

interface CollaborationServerOptions {
  name: string
  port: number
  redisUrl: string
  redisCache: RedisCache
  repository: Repository
  expressServer: Application
  quiet?: boolean
}

export class CollaborationServer {
  readonly #name: string
  readonly #port: number
  readonly #quiet: boolean
  readonly #expressServer: Application
  readonly #server: Hocuspocus
  readonly #repository: Repository
  readonly #redisCache: RedisCache
  #handlePaths: string[]
  #openForBusiness: boolean

  /**
   * Collaboration server constructor. Creates and initializes
   * a Hocuspocus server and it's extensions. Call listen() to
   * open collaboration server for business.
   */
  constructor({ name, port, redisUrl, redisCache, repository, expressServer, quiet = false }: CollaborationServerOptions) {
    this.#quiet = quiet
    this.#port = port
    this.#name = name
    this.#expressServer = expressServer
    this.#redisCache = redisCache
    this.#repository = repository

    this.#server = Server.configure({
      name: this.#name,
      port: this.#port,
      timeout: 30000,
      debounce: 5000,
      maxDebounce: 30000,
      quiet: this.#quiet,
      extensions: [
        new Logger(),
        new Redis({
          options: redisUrl
        }),
        new Database({
          fetch: async (payload) => { return await this.#fetchDocument(payload) },
          store: async (payload) => { await this.#storeDocument(payload) }
        })
      ],
      onAuthenticate: async (payload) => { return await this.#authenticate(payload) }
    })

    this.#handlePaths = []
    this.#openForBusiness = false
  }


  /**
   * Start listening for websocket connections on all specified paths
   */
  async listen(paths: string[]): Promise<boolean> {
    if (!this.#server || !this.#expressServer) {
      return false
    }

    if (this.#handlePaths.length || this.#openForBusiness) {
      console.warn('Collab server already open for business, closing, cleaning up and reinitializing')
      await this.close()
    }

    try {
      paths.forEach(path => {
        this.#expressServer.ws(path, (websocket, request) => {
          this.#server.handleConnection(websocket, request)
        })
      })
    } catch (ex) {
      console.error(ex)
      return false
    }

    return true
  }


  /**
   * Stop listening for incoming requests, clear paths to listen from.
   * This allows the server to reinitialize itself.
   */
  async close(): Promise<void> {
    if (!this.#server || !this.#openForBusiness) {
      return
    }

    try {
      await this.#server.destroy()
    } catch (ex) {
      console.error(ex)
    } finally {
      this.#openForBusiness = false
      this.#handlePaths = []
    }
  }


  /**
   * Authenticate using token
   */
  async #authenticate({ token }: onAuthenticatePayload): Promise<{
    token: string
    user: JWTPayload
  }> {
    try {
      await this.#repository.validateToken(token)
    } catch (ex) {
      throw new Error('Could not authenticate', { cause: ex })
    }

    return {
      token,
      user: { ...decodeJwt(token) }
    }
  }


  /**
   * Fetch document from redis if already in cache, otherwise from repository
   */
  async #fetchDocument({ documentName: uuid, document: yDoc, context }: fetchPayload): Promise<Uint8Array | null> {
    const state = await this.#redisCache.get(uuid)
    if (state) {
      return state
    }

    // Fetch content
    const documentResponse = await this.#repository.getDoc({
      uuid,
      accessToken: context.token
    })
    const { document } = documentResponse

    // Share complete original document
    const newsDocYMap = newsDocToYmap(documentResponse, yDoc.getMap('original'))
    yDoc.share.set('original', yMapAsYEventAny(newsDocYMap))

    if (document?.type === DocumentType.ARTICLE) {
      // Share editable content
      const slateDocument = newsDocToSlate(document?.content ?? [])
      const sharedContent = yDoc.get('content', Y.XmlText) as Y.XmlText
      sharedContent.applyDelta(
        slateNodesToInsertDelta(slateDocument)
      )

      // Share meta data map
      const newsValue = document?.meta.find(i => i.type === 'core/newsvalue')
      const metaYMap = yDoc.getMap('meta')
      metaYMap.set('core/newsvalue/score', newsValue?.data.score || 0)
      metaYMap.set('core/newsvalue/duration', newsValue?.data.duration || undefined)
      metaYMap.set('core/newsvalue/end', newsValue?.data.end || undefined)
      yDoc.share.set('meta', yMapAsYEventAny(metaYMap))

      return Y.encodeStateAsUpdate(yDoc)
    }

    if (document?.type === DocumentType.PLANNING) {
      const title = document?.title
      const sector = document?.links.find(l => l.type === 'tt/sector')
      const assignee = document.meta?.find(m => m.type === 'core/assignment')?.links
        .find(l => l.type === 'core/author')
      const planningItem = document?.meta.find(m => m.type === 'core/planning-item')

      const description = document?.meta.find(i => i.type === 'core/description')
      const assignments = document?.meta.filter(i => i.type === 'core/assignment')

      const planningYMap = yDoc.getMap('planning')

      planningYMap.set('core/planning-item/title', title || '')
      planningYMap.set('core/planning-item/sector', sector?.title || '')
      planningYMap.set('core/planning-item/status', planningItem?.data.public || 'false')
      planningYMap.set('core/planning-item/start', planningItem?.data.start_date || '')
      planningYMap.set('core/planning-item/end', planningItem?.data.end_date || '')
      planningYMap.set('core/author', assignee?.name.replace('/TT', '') || '')
      planningYMap.set('core/planning-item/priority', planningItem?.data.priority || 0)


      planningYMap.set('core/description/text', description?.data.text || '')
      planningYMap.set('core/assignments', assignments || [])


      yDoc.share.set('planning', yMapAsYEventAny(planningYMap))

      return Y.encodeStateAsUpdate(yDoc)
    }

    throw new Error('Can\'t determine DocumentType')
  }


  /**
   * Store document in redis cache
   */
  async #storeDocument({ documentName, state }: storePayload): Promise<void> {
    if (!await this.#redisCache.store(documentName, state)) {
      console.error(`Failed storing ${documentName} in cache`)
    }
  }
}

/*
 * Convenience function to cast types without eslint-disables everywhere
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function yMapAsYEventAny(yMap: Y.Map<unknown>): Y.AbstractType<Y.YEvent<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return yMap as unknown as Y.AbstractType<Y.YEvent<any>>
}
