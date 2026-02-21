import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as jsxRuntime from 'react/jsx-runtime'
import * as Y from 'yjs'
import * as LucideReact from 'lucide-react'

declare global {
  interface Window {
    __ec_react: typeof React
    __ec_react_jsx: typeof jsxRuntime
    __ec_react_dom: typeof ReactDOM
    __ec_yjs: typeof Y
    __ec_lucide: typeof LucideReact
    __ec_sdk: Record<string, unknown>
  }
}

/**
 * Phase 1: Assign shared library globals before React renders.
 * Must be called before createRoot().
 */
export function initPluginHost(): void {
  window.__ec_react = React
  window.__ec_react_jsx = jsxRuntime
  window.__ec_react_dom = ReactDOM
  window.__ec_yjs = Y
  window.__ec_lucide = LucideReact
  window.__ec_sdk = window.__ec_sdk ?? {}

  // Expose BASE_URL so plugins can construct proper view paths
  window.__ec_sdk.BASE_URL = import.meta.env.BASE_URL
}
