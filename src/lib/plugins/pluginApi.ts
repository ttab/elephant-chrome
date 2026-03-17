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

// Injection points
export { InjectionPoint } from '@/lib/injectionPoints'
export type { InjectionPointProps, InjectionPointRendererProps } from '@/lib/injectionPoints'

// Slate editor access (available inside injection points within a Textbit/Slate context)
// Runtime: re-exported from slate-react and slate
// Types: manually declared in sdk/preamble.d.ts (auto-generation produces unusable internal types)
export { useSlate } from 'slate-react'
export { Editor as SlateEditor, Range as SlateRange } from 'slate'

// Document service for plugins (full Twirp Documents client)
export { useDocumentService } from './useDocumentAPI'
export type { DocumentService } from './useDocumentAPI'

// Comment service for plugins (threaded commenting with ACL)
export { useCommentService } from './useCommentService'
export type { CommentService } from './useCommentService'

// Y.XmlText conversion utilities for Textbit-compatible collaborative text
export { toSlateYXmlText } from '@/shared/transformations/lib/toSlateYXmlText'
export { slateNodesToInsertDelta } from '@slate-yjs/core'

// NewsDoc ↔ Slate transformations
export { newsDocToSlate, slateToNewsDoc } from '@/shared/transformations/newsdoc'

// Multi-editor support — prevents cross-editor interference in slate-yjs
export { UniqueEditorOrigin } from '@/components/UniqueEditorOrigin'

// Textbit editor components and hooks for building full editors in plugins
export {
  Textbit,
  Toolbar as TextbitToolbar,
  Menu as TextbitMenu,
  useTextbit,
  usePluginRegistry,
  useAction,
  useEditor,
  useContextMenuHints,
  type TBPluginDefinition,
  type TBPluginInitFunction,
} from '@ttab/textbit'

// Textbit plugins for editor functionality
export {
  Bold,
  Italic,
  Underline,
  Link,
  Text as TextPlugin,
  LocalizedQuotationMarks,
  Blockquote,
  OrderedList,
  UnorderedList,
  Table as TablePlugin,
} from '@ttab/textbit-plugins'

// Types that plugins need for registration and routing
export type { ViewProps, ViewMetadata, ViewRegistryItem } from '@/types'
export type { ActivityDefinition, ViewRouteFunc, ResolvedRoute } from '@/lib/documentActivity'
export type { PluginInstance, PluginContext } from './types'
