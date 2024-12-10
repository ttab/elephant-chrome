import { transformText, revertText, transformUnorderedList } from './core/index.js'
import { transformVisual, revertVisual } from './tt/visual.js'
import type { TBElement } from '@ttab/textbit'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { revertFactbox, transformFactbox } from './core/factbox.js'

/**
 * Convert a NewsDoc block array to slate TBElement array
 */
export function newsDocToSlate(content: Block[]): TBElement[] {
  if (content !== undefined && Array.isArray(content)) {
    return content.map((element: Block) => {
      switch (element.type) {
        case 'core/text':
          return transformText(element)
        case 'tt/visual':
          return transformVisual(element)
        case 'core/factbox':
          return transformFactbox(element)
        case 'core/unordered-list':
          return transformUnorderedList(element)
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
export async function slateToNewsDoc(elements: TBElement[]): Promise<Block[] | undefined> {
  if (Array.isArray(elements)) {
    return await Promise.all(elements.map(async (element: TBElement): Promise<Block> => {
      switch (element.type) {
        case 'core/text':
          return await revertText(element)
        case 'tt/visual':
        case 'core/image':
          return revertVisual(element)
        case 'core/factbox':
          return await revertFactbox(element)
        default:
          throw new Error(`Element not implemented: ${element.type}`)
      }
    }))
  }

  return []
}
