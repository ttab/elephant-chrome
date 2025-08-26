import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'

const blockType = 'core/softcrop'

/**
   * From NewsDoc Block to an object
   *
   * @param {Block[]} blocks
   * @returns {Record<string, string | number | null> | undefined}
   */
export const transformSoftcrop = (blocks: Block[]): Record<string, string | number | null> | undefined => {
  const block = blocks.find((item) => item.type === 'core/softcrop')
  if (block?.type !== blockType) {
    return
  }

  const properties: Record<string, string> = {}
  if (typeof block?.data.crop === 'string') {
    properties.crop = block.data.crop
  }

  if (typeof block?.data.focus === 'string') {
    properties.focus = block.data.focus
  }

  return properties
}

/**
   * From Textbit element to a NewsDoc Block
   * @param {TBElement} element
   * @returns {Block[]}
   */
export const revertSoftcrop = (element: TBElement): Block[] => {
  const { properties } = element
  if (!properties?.crop || !properties?.focus) {
    return []
  }

  const block: Block = Block.create({
    type: blockType,
    data: {}
  })

  if (typeof properties.crop === 'string') {
    block.data.crop = properties.crop
  }

  if (typeof properties.focus === 'string') {
    block.data.focus = properties.focus
  }

  return [block]
}
