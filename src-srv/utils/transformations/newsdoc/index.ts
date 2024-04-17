import { transformText, revertText } from './core/index.js'
import { transformVisual, revertVisual } from './tt/visual.js'
import type { TBElement } from '@ttab/textbit'
import type {
  Block,
  GetDocumentResponse
} from '../../../protos/service.js'

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

/**
 * Convert a NewsDoc block array to slate TBElement array
 */
export function newsDocToSlate(content: Block[]): TBElement[] {
  if (content !== undefined) {
    return content.map((element: Block) => {
      switch (element.type) {
        case 'core/heading-1':
        case 'core/heading-2':
        case 'core/paragraph':
        case 'core/preamble':
        case 'core/dateline':
        case 'tt/dateline':
          return transformText(element)
        case 'tt/visual':
          return transformVisual(element)
        case 'core/factbox':
          return {
            id: 'factbox',
            class: 'text',
            type: 'core/text',
            children: [
            ]
          }
        default:
          throw new Error(`Element not implemented: ${element.type}`)
      }
    })
  }
  throw new Error('No document to transform')
}

/**
 * Convert a slate TBElement array to a NewsDoc block array
 */
export function slateToNewsDoc(elements: TBElement[]): Block[] {
  if (elements !== undefined) {
    return elements.map((element: TBElement): Block => {
      switch (element.type) {
        case 'core/text':
          return revertText(element)
        case 'tt/visual':
        case 'core/image':
          return revertVisual(element)
        default:
          throw new Error(`Element not implemented: ${element.type}`)
      }
    })
  }
  throw new Error('No elements provided for transformation')
}


/**
 * Convert a complete slate document to a complete NewsDoc document
 */
export function slateToNewsDocument(data: SlateDoc): GetDocumentResponse {
  const { document } = data

  if (!document !== undefined) {
    throw new Error('no document to transform')
  }

  return {
    ...data,
    document: {
      ...data.document,
      content: slateToNewsDoc(document.content)
    }
  }
}
