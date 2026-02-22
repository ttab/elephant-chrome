import { useEffect, useRef } from 'react'
import { useNavigation } from '@/navigation/hooks/useNavigation'
import { documentActivityRegistry } from '@/lib/documentActivity'
import { injectionPointRegistry } from '@/lib/injectionPoints'
import * as pluginApi from './pluginApi'
import { pluginManager } from './PluginManager'
import type { PluginContext } from './types'

/**
 * Phase 2: Assign context-dependent APIs to window.__ec_sdk
 * and auto-load saved plugins. Must be mounted inside the full
 * provider hierarchy (after NavigationProvider).
 */
export const PluginHostCompleter = (): null => {
  const { state } = useNavigation()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) {
      return
    }
    initialized.current = true

    const viewRegistry = state.viewRegistry

    // Expose host hooks and components to plugins via window global
    Object.assign(window.__ec_sdk, pluginApi)

    // Set up context factory for plugin activation
    pluginManager.setContextFactory((): PluginContext => ({
      documentActivity: {
        register: documentActivityRegistry.register
      },
      viewRegistry: {
        register: viewRegistry.set
      },
      injectionPoints: {
        register: injectionPointRegistry.register
      }
    }))

    // Auto-load saved plugins
    const saved = pluginManager.getSavedManifestUrls()
    for (const url of saved) {
      pluginManager.loadPlugin(url).catch((err) => {
        console.warn(`[plugins] auto-load failed for ${url}:`, err)
      })
    }
  }, [state.viewRegistry])

  return null
}
