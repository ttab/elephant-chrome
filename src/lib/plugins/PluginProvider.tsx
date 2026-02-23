import { type JSX, type PropsWithChildren, useMemo, useSyncExternalStore, createContext } from 'react'
import { pluginManager } from './PluginManager'
import type { LoadedPlugin } from './types'

export interface PluginContextValue {
  plugins: LoadedPlugin[]
  loadPlugin: (manifestUrl: string) => Promise<void>
  unloadPlugin: (id: string) => void
  version: number
}

export const PluginContext = createContext<PluginContextValue | null>(null)

export const PluginProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const version = useSyncExternalStore(
    pluginManager.subscribe,
    pluginManager.getVersion
  )

  const value = useMemo<PluginContextValue>(() => ({
    plugins: pluginManager.getLoadedPlugins(),
    loadPlugin: (manifestUrl: string) => pluginManager.loadPlugin(manifestUrl),
    unloadPlugin: (id: string) => pluginManager.unloadPlugin(id),
    version
  }), [version])

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  )
}
