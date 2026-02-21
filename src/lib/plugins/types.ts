import type { ViewRegistryItem } from '@/types'
import type { DocumentType, ActivityId, ActivityDefinition } from '@/lib/documentActivity'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  entry: string
  css?: string[]
  sdkVersion: string
}

export interface PluginContext {
  documentActivity: {
    register: (docType: DocumentType, activityId: ActivityId, definition: ActivityDefinition) => (() => void)
  }
  viewRegistry: {
    register: (name: string, item: ViewRegistryItem) => (() => void)
  }
}

export interface PluginInstance {
  activate: (context: PluginContext) => (() => void) | void
}

export interface LoadedPlugin {
  id: string
  name: string
  version: string
  description?: string
  manifestUrl: string
  cleanup: (() => void) | null
}
