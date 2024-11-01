import {
  type onStoreDocumentPayload,
  type Extension,
  type onDisconnectPayload
} from '@hocuspocus/server'
import { type DebouncedFunc, debounce } from 'lodash-es'

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
    const { documentName, context } = payload


    // Ignore document-tracker and server actions on the document
    // We dont need to snapshot the these
    if (documentName !== 'document-tracker' && context.agent !== 'server') {
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
  }

  async onDisconnect(payload: onDisconnectPayload): Promise<void> {
    const debouncedFn = debounceMap.get(payload.documentName)

    // If the document has a debounceFn it's dirty, check if there are no other clients
    if (debouncedFn && payload.clientsCount === 0) {
      // Flush (immidiately call the function)
      await debouncedFn.flush()
    }
  }
}
