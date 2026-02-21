/**
 * Plugin API barrel — the single source of truth for what the host
 * exposes to plugins via window.__ec_sdk.
 *
 * Adding an export here automatically:
 *   1. Makes it available at runtime (PluginHostCompleter assigns it)
 *   2. Generates the SDK type declaration (npm run sdk:types)
 *
 * Special globals (BASE_URL, registerPlugin) that cannot be normal
 * re-exports are handled separately in pluginHost.ts and sdk/preamble.d.ts.
 */

// Hooks
export { useYDocument } from '@/modules/yjs/hooks/useYDocument'
export type { YDocument } from '@/modules/yjs/hooks/useYDocument'
export { useYValue } from '@/modules/yjs/hooks/useYValue'

// View chrome components
export { ViewHeader, View } from '@/components/View'

// Form components
export { TextBox } from '@/components/ui/TextBox'
export { Form } from '@/components/Form'

// Activity execution
export { resolveEventOptions } from '@/lib/documentActivity'
export type { ExecuteOptions } from '@/lib/documentActivity'

// Types that plugins need for registration and routing
export type { ViewProps, ViewMetadata, ViewRegistryItem } from '@/types'
export type { ActivityDefinition, ViewRouteFunc, ResolvedRoute } from '@/lib/documentActivity'
export type { PluginInstance, PluginContext } from './types'
