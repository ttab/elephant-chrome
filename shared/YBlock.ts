import { Block } from '@ttab/elephant-api/newsdoc'
import { type PartialMessage } from '@protobuf-ts/runtime'
import { group } from '../src-srv/utils/transformations/groupedNewsDoc'

export const YBlock = {
  create: (value: PartialMessage<Block>) => {
    const clone = structuredClone(value)
    if (!clone.type) {
      clone.type = '__tempKey'
    }

    // We only want to return the actual EleBlock[]
    return group([Block.create(clone)], 'type')[clone.type]
  }
}
