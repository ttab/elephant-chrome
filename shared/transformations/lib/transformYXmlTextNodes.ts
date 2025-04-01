import { type EleBlockGroup } from '@/shared/types/index.js'
import { yTextToSlateElement } from '@slate-yjs/core'
import { Node } from 'slate'
import * as Y from 'yjs'

type Result = Record<string, EleBlockGroup | string> | Record<string, unknown>

export function transformYXmlTextNodes(ymap: Y.Map<unknown>): Result {
  const result: Result = {}

  for (const [key, value] of ymap.entries()) {
    if (value instanceof Y.Map) {
      result[key] = transformYXmlTextNodes(value)
    } else if (value instanceof Y.Array) {
      result[key] = value.toArray()
        .map((item): unknown => item instanceof Y.Map ? transformYXmlTextNodes(item) : item)
    } else if (value instanceof Y.XmlText) {
      // If the value consist of several Y.XmlText nodes, we need to join each of them
      // together by newlines, in order to persist the newlines to the repository.
      const textNodes = value?.length ? yTextToSlateElement(value).children.map(Node.string) : []
      result[key] = textNodes.join('\n')
    } else {
      result[key] = value
    }
  }

  return result
}
