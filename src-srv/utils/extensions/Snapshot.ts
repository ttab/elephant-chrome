import {
  type onStoreDocumentPayload,
  type Extension,
  type onDisconnectPayload
} from '@hocuspocus/server'
import { type DebouncedFunc, debounce } from 'lodash-es'
import { assertContext } from '../../lib/assertContext.js'
import { isValidUUID } from '../isValidUUID.js'
import logger from '../../lib/logger.js'

interface DefaultConfiguration {
  debounce: number
}

interface Configuration extends DefaultConfiguration {
  snapshot: (payload: onStoreDocumentPayload) => () => Promise<void>
}

const debounceMap = new Map<string, DebouncedFunc<() => Promise<void>>>()

export class Snapshot implements Extension {
  configuration: Configuration

  constructor(configuration: Configuration) {
    const defaultConfig: DefaultConfiguration = {
      debounce: 60000
    }

    this.configuration = { ...defaultConfig, ...configuration }
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
    const fn = this.configuration.snapshot(payload)
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
