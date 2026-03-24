import { z } from 'zod'
import type { LoadedPlugin, PluginManifest, PluginContext, PluginInstance } from './types'

const STORAGE_KEY = 'elephant-chrome:plugins'

const manifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  entry: z.string(),
  css: z.array(z.string()).optional(),
  sdkVersion: z.string()
})

class PluginManager {
  private plugins = new Map<string, LoadedPlugin>()
  private cssLinks = new Map<string, HTMLLinkElement[]>()
  private listeners = new Set<() => void>()
  private version = 0
  private contextFactory: (() => PluginContext) | null = null

  setContextFactory(factory: () => PluginContext): void {
    this.contextFactory = factory
  }

  async loadPlugin(manifestUrl: string): Promise<void> {
    const response = await fetch(manifestUrl)
    if (!response.ok) {
      throw new Error(`fetch manifest: ${response.status} ${response.statusText}`)
    }

    const raw: unknown = await response.json()
    const manifest = manifestSchema.parse(raw) as PluginManifest

    if (this.plugins.has(manifest.id)) {
      throw new Error(`plugin "${manifest.id}" is already loaded`)
    }

    const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1)

    // Inject CSS
    const cssElements: HTMLLinkElement[] = []
    if (manifest.css) {
      for (const cssPath of manifest.css) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = new URL(cssPath, baseUrl).href
        link.dataset.pluginId = manifest.id
        document.head.appendChild(link)
        cssElements.push(link)
      }
    }
    this.cssLinks.set(manifest.id, cssElements)

    // Fetch and execute JS
    const entryUrl = new URL(manifest.entry, baseUrl).href
    const jsResponse = await fetch(entryUrl)
    if (!jsResponse.ok) {
      this.removeCss(manifest.id)
      throw new Error(`fetch plugin entry: ${jsResponse.status} ${jsResponse.statusText}`)
    }

    const jsText = await jsResponse.text()

    // Plugin will call window.__ec_sdk.registerPlugin() during execution
    const registeredPlugin = await new Promise<PluginInstance>((resolve, reject) => {
      const prevRegister = window.__ec_sdk.registerPlugin as
        ((instance: PluginInstance) => void) | undefined

      window.__ec_sdk.registerPlugin = (instance: PluginInstance) => {
        resolve(instance)
      }

      try {
        // Declare host globals as local vars so the plugin IIFE can
        // resolve them even if the bare global lookup would throw a
        // ReferenceError (e.g. after Vite HMR re-evaluates modules
        // without re-running initPluginHost).
        const globalsPreamble = [
          '__ec_sdk', '__ec_react', '__ec_react_jsx',
          '__ec_react_dom', '__ec_yjs', '__ec_lucide'
        ].map((g) => `${g}=window.${g}`).join(',')

        const script = document.createElement('script')
        script.textContent = `var ${globalsPreamble};\n${jsText}`
        script.dataset.pluginId = manifest.id
        document.head.appendChild(script)
        document.head.removeChild(script)
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }

      // Restore previous registerPlugin
      if (prevRegister) {
        window.__ec_sdk.registerPlugin = prevRegister
      }

      // Timeout if plugin didn't call registerPlugin
      setTimeout(() => {
        reject(new Error(`plugin "${manifest.id}" did not call registerPlugin`))
      }, 5000)
    })

    if (!this.contextFactory) {
      this.removeCss(manifest.id)
      throw new Error('plugin context not available yet')
    }

    const context = this.contextFactory()
    const cleanup = registeredPlugin.activate(context) ?? null

    this.plugins.set(manifest.id, {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      manifestUrl,
      cleanup
    })

    this.version++
    this.notifyListeners()
    this.persistManifestUrls()
  }

  unloadPlugin(id: string): void {
    const plugin = this.plugins.get(id)
    if (!plugin) {
      return
    }

    plugin.cleanup?.()
    this.removeCss(id)
    this.plugins.delete(id)

    this.version++
    this.notifyListeners()
    this.persistManifestUrls()
  }

  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  getSavedManifestUrls(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string')
      }
      return []
    } catch {
      return []
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  getVersion = (): number => {
    return this.version
  }

  private removeCss(id: string): void {
    const links = this.cssLinks.get(id)
    if (links) {
      for (const link of links) {
        link.remove()
      }
      this.cssLinks.delete(id)
    }
  }

  private persistManifestUrls(): void {
    const urls = Array.from(this.plugins.values()).map((p) => p.manifestUrl)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls))
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export const pluginManager = new PluginManager()
