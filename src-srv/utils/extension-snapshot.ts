import {
  type onStoreDocumentPayload,
  type Extension
} from '@hocuspocus/server'
import { debounce } from 'lodash-es'

interface Configuration {
  debounce: number
  snapshot: (payload: onStoreDocumentPayload) => Promise<() => Promise<void>>
}

const debounceMap = new Map<string, () => Promise<void>>()

export class Snapshot implements Extension {
  configuration: Configuration = {
    debounce: 600000
  }

  constructor(configuration?: Partial<Configuration>) {
    this.configuration = { ...this.configuration, ...configuration }
  }

  async onStoreDocument(payload: onStoreDocumentPayload): Promise<void> {
    const { documentName } = payload

    if (documentName !== 'document-tracker') {
      // Clear previous debounce
      debounceMap.get(documentName)?.cancel()

      // Create debounce
      const fn = await this.configuration.snapshot(payload)
      const debouncedFn: () => Promise<void> = debounce(fn, this.configuration.debounce)

      // Set new debounce
      debounceMap.set(documentName, debouncedFn)

      // Call the debounced function
      await debouncedFn()
    }
  }

  async onDisconnect(payload: onStoreDocumentPayload): Promise<void> {
    const debouncedFn = debounceMap.get(payload.documentName)
    // If the document has a debounceFn it's dirty, check if there are no other clients
    if (debouncedFn && payload.clientsCount === 0) {
      // Flush (immidiately call the function)
      await debouncedFn.flush()
    }
  }
}
