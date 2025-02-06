import { transformText, revertText, transformUnorderedList } from './core/index.js'
import { transformVisual, revertVisual } from './tt/visual.js'
import type { TBElement } from '@ttab/textbit'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { revertFactbox, transformFactbox } from './core/factbox.js'
import { revertTable, transformTable } from './core/table.js'

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
        case 'core/table':
          return transformTable(element)
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
export function slateToNewsDoc(elements: TBElement[]): Block[] | undefined {
  if (!Array.isArray(elements)) {
    return []
  }

  return elements.map((element: TBElement) => {
    switch (element.type) {
      case 'core/text':
        return revertText(element)

      case 'tt/visual':
      case 'core/image':
        return revertVisual(element)

      case 'core/factbox':
        return revertFactbox(element)

      case 'core/table':
        return revertTable(element)

      default:
        throw new Error(`Element not implemented: ${element.type}`)
    }
  })
}
