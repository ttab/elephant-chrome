import {
  type onStoreDocumentPayload,
  type Extension,
  type onDisconnectPayload
} from '@hocuspocus/server'
import { type DebouncedFunc, debounce } from 'lodash-es'
import type { Context } from '../../lib/assertContext.js'
import { assertContext } from '../../lib/assertContext.js'
import { isValidUUID } from '../isValidUUID.js'
import logger from '../../lib/logger.js'

const BASE_URL = process.env.BASE_URL || ''

interface Configuration {
  debounce: number
}

const debounceMap = new Map<string, DebouncedFunc<() => Promise<SnapshotResponse>>>()

export class Snapshot implements Extension {
  configuration: Configuration

  constructor(configuration: Configuration) {
    this.configuration = configuration
  }

  async onStoreDocument(payload: onStoreDocumentPayload): Promise<void> {
    const { documentName, context } = payload as { documentName: string, context: unknown }

    // Ignore document-tracker, server actions, and userTracker
    if (isExcluded(documentName, context) || !isValidUUID(documentName)) {
      return
    }

    if (!assertContext(context)) {
      throw new Error('Invalid context provided')
    }

    // Clear previous debounce
    debounceMap.get(documentName)?.cancel()

    // Create debounce
    const fn = () => snapshot(documentName, context)
    const debouncedFn = debounce(fn, this.configuration.debounce)

    // Set new debounce
    debounceMap.set(documentName, debouncedFn)

    // Call the debounced function
    await debouncedFn()
  }

  async onDisconnect(payload: onDisconnectPayload): Promise<void> {
    try {
      const debouncedFn = debounceMap.get(payload.documentName)

      // If the document has a debounceFn it's dirty, check if there are no other clients
      if (debouncedFn && payload.clientsCount === 0) {
      // Flush (immidiately call the function)
        await debouncedFn.flush()
      }
    } catch (ex) {
      logger.error(ex, 'Error onSnapshot onDisconnect')
    }
  }
}

function isExcluded(documentName: string, context: unknown): boolean {
  if (documentName === 'document-tracker') {
    return true
  }
  if (
    typeof context === 'object'
    && context !== null
    && 'agent' in context
    && (context as { agent: unknown }).agent === 'server'
  ) {
    return true
  }
  if (
    typeof context === 'object'
    && context !== null
    && 'user' in context
    && typeof (context as { user: unknown }).user === 'object'
    && (context as { user: { sub?: string } }).user !== null
    && 'sub' in (context as { user: { sub?: string } }).user
    && documentName === (context as { user: { sub?: string } }).user.sub
  ) {
    return true
  }
  return false
}

type SnapshotResponse = {
  statusCode: number
  statusMessage: string
} | {
  version: string
  uuid: string
  statusMessage: undefined
} | undefined

export async function snapshot(uuid: string, context: Context): Promise<SnapshotResponse> {
  if (!uuid) {
    throw new Error('UUID is required')
  }

  try {
    const base = `${process.env.PROTOCOL || 'http'}://${process.env.HOST || 'localhost'}${process.env.PORT ? `:${process.env.PORT}` : ''}`
    const url = new URL(`${BASE_URL}/api/snapshot/${uuid}`, base)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
        ...(context.user && { 'X-User': JSON.stringify(context.user) })
      }
    })
    const data = await response.json() as SnapshotResponse

    if (!response.ok) {
      throw new Error((data && typeof data?.statusMessage === 'string')
        ? data.statusMessage
        : response.statusText)
    }

    return data
  } catch (ex) {
    logger.error(ex, 'Failed to save snapshot')
  }
}
