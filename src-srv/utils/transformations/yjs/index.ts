import * as Y from 'yjs'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import type { GetDocumentResponse } from '../../../protos/service.js'
import { type TextbitElement } from '@ttab/textbit'
import { revertNewsdoc } from '../newsdoc/index.js'

export function yjsStateAsUpdate (content: TextbitElement[], data: Y.Doc): Uint8Array {
  const insertContentDelta = slateNodesToInsertDelta(content)
  const sharedContentRoot = data.get('content', Y.XmlText) as Y.XmlText
  sharedContentRoot.applyDelta(insertContentDelta)
  data.share.set('content', sharedContentRoot as Y.AbstractType<any>)

  return Y.encodeStateAsUpdate(data)
}

/**
 * Helper function to transform a newsDoc to a Y.Map()
 * @param data GetDocumentResponse
 * @param map Y.Map<unknown>
 * @returns Y.Map<unknown>
 */
export function newsDocToYmap (data: GetDocumentResponse, map: Y.Map<unknown>): Y.Map<unknown> {
  const d = {
    ...data,
    version: data.version.toString()
  }

  for (const key in d) {
    const value = d[key as keyof typeof d]
    if (typeof value === 'object') {
      const m = new Y.Map()
      if (Array.isArray(value)) {
        const a = new Y.Array()
        if (value?.length > 0) {
          a.push([newsDocToYmap(value as unknown as GetDocumentResponse, m)])
        }
        map.set(key, a)
      } else {
        for (const k in value) {
          m.set(k, value[k as keyof typeof value])
        }
        map.set(key, m)
      }
    }
    map.set(key, value)
  }
  return map
}

/**
* Helper function to transform a Document(Y.Doc) to a newsDoc
* @param document Document
* @returns GetDocumentResponse
*/
export function yDocToNewsDoc (document: Y.Doc): GetDocumentResponse {
  const original = document.get('original', Y.Map) as Y.Map<unknown>
  const json = original.toJSON()

  // revert content
  const sharedRoot = document.get('content', Y.XmlText) as Y.XmlText
  const content = yTextToSlateElement(sharedRoot).children
  json.document.content = revertNewsdoc(content as any)
  json.version = BigInt(json.version)

  return json as GetDocumentResponse
}
