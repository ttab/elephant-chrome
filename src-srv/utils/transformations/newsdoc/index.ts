import { transformText, revertText } from './core/index.js'
import { transformVisual, revertVisual } from './tt/visual.js'
import { type Block } from '../../../protos/service.js'
import type { TBElement } from '@ttab/textbit'

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
