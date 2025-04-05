import { Block } from '@ttab/elephant-api/newsdoc'
import { group } from './transformations/groupedNewsDoc'

export const YBlock = {
  create: (value: Partial<Block>) => {
    const clone = structuredClone(value)
    if (!clone.type) {
      clone.type = '__tempKey'
    }

    // We only want to return the actual EleBlock[]
    return group([Block.create(clone)], 'type')[clone.type]
  }
}
