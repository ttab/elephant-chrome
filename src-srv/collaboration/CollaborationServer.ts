import { Server, type Hocuspocus } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import { Redis as PubsubExtension } from '@hocuspocus/extension-redis'

import type { Redis } from '../utils/Redis.js'
import type { Repository } from '@/shared/Repository.js'
import type { User } from '@/shared/User.js'

import {
  type Application
} from 'express-ws'

import { Auth } from './extensions/Auth.js'
import { OpenDocuments } from './extensions/OpenDocuments.js'
import { RepositoryExtension } from './extensions/Repository.js'

import CollaborationServerErrorHandler, { withErrorHandler } from '../lib/errorHandler.js'
import logger from '../lib/logger.js'
import type { AuthInfo } from '../utils/authConfig.js'
import { CacheExtension } from './extensions/Cache.js'
import type { Context } from '../lib/context.js'

interface CollaborationServerOptions {
  name: string
  port: number
  redisUrl: string
  redis: Redis
  repository: Repository
  user: User
  expressServer: Application
  authInfo: AuthInfo
  quiet?: boolean
}

export class CollaborationServer {
  readonly #port: number
  readonly #quiet: boolean
  readonly #expressServer: Application
  readonly server: Hocuspocus
  readonly #repository: Repository
  readonly #errorHandler: CollaborationServerErrorHandler
  readonly #openDocuments: OpenDocuments
  readonly #repositoryExtension: RepositoryExtension

  #handlePaths: string[]
  #openForBusiness: boolean = false

  /**
   * Collaboration server constructor. Creates and initializes
   * a Hocuspocus server and it's extensions. Call listen() to
   * open collaboration server for business.
   */
  constructor(configuration: CollaborationServerOptions) {
    this.#quiet = configuration.quiet ?? false
    this.#port = configuration.port
    this.#expressServer = configuration.expressServer
    this.#repository = configuration.repository
    this.#errorHandler = new CollaborationServerErrorHandler(configuration.user)
    this.#openDocuments = new OpenDocuments()
    this.#repositoryExtension = new RepositoryExtension({
      repository: this.#repository,
      errorHandler: this.#errorHandler,
      redis: configuration.redis
    })

    const {
      host: redisHost,
      port: redisPort,
      username: redisUsername,
      password: redisPassword,
      protocol: redisProtocol
    } = new URL(configuration.redisUrl)

    this.#quiet = process.env.LOG_LEVEL !== 'info' && process.env.LOG_LEVEL !== 'debug'

    this.server = Server.configure({
      name: crypto.randomUUID(), // We need a server instance id to be able to acquire locks
      port: this.#port,
      timeout: 30000,
      debounce: 5000,
      maxDebounce: 30000,
      quiet: this.#quiet,
      extensions: withErrorHandler([
        new Logger({
          onChange: false,
          log: (msg) => {
            logger.info(msg)
          }
        }),
        new PubsubExtension({
          prefix: 'elc::hp',
          host: redisHost,
          port: parseInt(redisPort, 10),
          options: {
            username: redisUsername,
            password: redisPassword,
            tls: redisProtocol === 'rediss:'
          }
        }),
        this.#openDocuments,
        new CacheExtension({
          redis: configuration.redis,
          errorHandler: this.#errorHandler
        }),
        this.#repositoryExtension,
        new Auth(configuration.authInfo.oidcConfig)
      ], this.#errorHandler)
    })

    this.#handlePaths = []
  }

  /**
   * Start listening for websocket connections on all specified paths
   */
  async listen(paths: string[]): Promise<boolean> {
    if (!this.server || !this.#expressServer) {
      return false
    }

    if (this.#handlePaths.length || this.#openForBusiness) {
      this.#errorHandler.warn('Collab server already open for business, closing, cleaning up and reinitializing')
      await this.close()
    }

    // Apply the server to errorHandler
    this.#errorHandler.setServer(this.server)

    try {
      paths.forEach((path) => {
        this.#expressServer.ws(path, (websocket, request) => {
          if (this.#openForBusiness) {
            this.server.handleConnection(websocket, request)
          }
        })
      })
      this.#openForBusiness = true
    } catch (ex) {
      this.#errorHandler.fatal(ex)
    }

    return this.#openForBusiness
  }

  /**
   * Stop listening for incoming requests, clear paths to listen from.
   * This allows the server to reinitialize itself.
   */
  async close(): Promise<void> {
    if (!this.server || !this.#openForBusiness) {
      return
    }

    try {
      this.#openForBusiness = false
      await this.server.destroy()
      // FIXME: Remove the express server paths setup in listen..?
    } catch (ex) {
      this.#errorHandler.error(ex)
    } finally {
      this.#handlePaths = []
    }
  }

  /**
   * Handles flushing of unsaved document changes as well as adding
   * new/created(?) documents to the users history/tracking document.
   */
  async flushDocument(id: string, context: Context, options?: {
    status?: string
    cause?: string
    addToHistory?: boolean
  }): Promise<{
    version: string
  } | void> {
    return this.#repositoryExtension.flushDocument(id, context, options)
  }

  /**
   * Number of HocusPocus provider connections (not number of websocket connections)
   */
  getConnectionsCount(): number {
    return this.server ? this.server.getConnectionsCount() : 0
  }

  /**
   * Number of open documents
   */
  getDocumentsCount(): number {
    return this.server ? this.server.getDocumentsCount() : 0
  }

  /**
   * Snapshot of open documents and by who
   */
  getSnapshot() {
    return this.#openDocuments.getSnapshot()
  }
}
