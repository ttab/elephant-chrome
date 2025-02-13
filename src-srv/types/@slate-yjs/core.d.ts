import '@slate-yjs/core'
import type { Element } from 'slate'

declare module '@slate-yjs/core' {
  export function slateNodesToInsertDelta(element: TBElement[]): InsertDelta[]
  export function yTextToSlateElement(yText: Y.XmlText): Element
}
