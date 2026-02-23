import type { FC } from 'react'
import type { ViewRegistryItem } from '@/types'
import type { DocumentType, ActivityId, ActivityDefinition } from '@/lib/documentActivity'
import type { InjectionPointRendererProps } from '@/lib/injectionPoints'

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
  injectionPoints: {
    register: (pointId: string, rendererId: string, renderer: FC<InjectionPointRendererProps>) => (() => void)
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
