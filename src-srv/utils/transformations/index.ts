import type { GetDocumentResponse, Block } from '../../protos/service.js'
import { transformNewsdoc, revertNewsdoc } from './newsdoc/index.js'
import type { TBElement } from '@ttab/textbit'
import { newsDocToYmap, yjsStateAsUpdate } from './yjs/index.js'
import type * as Y from 'yjs'

export interface SlateDoc {
  version: bigint
  document: {
    language: string
    uuid: string
    type: string
    uri: string
    url: string
    title: string
    content: TBElement[]
    meta: Block[]
    links: Block[]
  }
}

// Add different transformers here
const transformer = transformNewsdoc
const reverter = revertNewsdoc

export function initDoc(data: GetDocumentResponse, doc: Y.Doc): Uint8Array {
  // TODO: Should set `meta` and `links` once a slate format is set
  const origMap = doc.getMap('original')
  const result = newsDocToYmap(data, origMap)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc.share.set('original', result as unknown as Y.AbstractType<Y.YEvent<any>>)

  // Format and add content as slate editable
  const content = transformer(data.document?.content ?? [])
  return yjsStateAsUpdate(content, doc)
}

export function revert(data: SlateDoc): GetDocumentResponse {
  if (data.document !== undefined) {
    return {
      ...data,
      document: {
        ...data.document,
        content: reverter(data.document.content)
      }
    }
  }
  throw new Error('no document to transform')
}
