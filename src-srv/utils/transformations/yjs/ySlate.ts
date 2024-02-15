import * as Y from 'yjs'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import type { GetDocumentResponse } from '../../../protos/service.js'
import { type TBElement } from '@ttab/textbit'
import { slateToNewsDoc } from '../index.js'

export function yjsStateAsUpdate(content: TBElement[], data: Y.Doc): Uint8Array {
  const insertContentDelta = slateNodesToInsertDelta(content)
  const sharedContentRoot = data.get('content', Y.XmlText) as Y.XmlText
  sharedContentRoot.applyDelta(insertContentDelta)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  data.share.set('content', sharedContentRoot as Y.AbstractType<any>)

  return Y.encodeStateAsUpdate(data)
}

/**
* Helper function to transform a Document(Y.Doc) to a newsDoc
* @param document Document
* @returns GetDocumentResponse
*/
export function yDocToNewsDoc(document: Y.Doc): GetDocumentResponse {
  const original = document.get('original', Y.Map) as Y.Map<unknown>
  const json = original.toJSON()

  // revert content
  const sharedRoot = document.get('content', Y.XmlText) as Y.XmlText
  const content: TBElement[] = yTextToSlateElement(sharedRoot).children
  const version: number = json.version

  json.document.content = slateToNewsDoc(content)
  json.version = BigInt(version)

  return json as GetDocumentResponse
}
