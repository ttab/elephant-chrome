import type { GetDocumentResponse, Block } from '../../protos/service.js'
import { slateToNewsDoc } from './newsdoc/index.js'
import type { TBElement } from '@ttab/textbit'

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
// const transformer = newsDocToSlate
const reverter = slateToNewsDoc

/**
 * Convert from newsDoc to Uint8Array
 */
// export function toUint8Array(data: GetDocumentResponse, yDoc: Y.Doc): Uint8Array {
//   // TODO: Should set `meta` and `links` once a slate format is set

//   // Set original
//   const yMap = newsDocToYmap(data, yDoc.getMap('original'))
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   yDoc.share.set('original', yMap as unknown as Y.AbstractType<Y.YEvent<any>>)

//   // Format and add content as slate editable
//   const content = transformer(data.document?.content ?? [])
//   return yjsStateAsUpdate(content, yDoc)
// }


/**
 * Convert Y.Doc to Slate document
 */
export function toNewsDoc(data: SlateDoc): GetDocumentResponse {
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
