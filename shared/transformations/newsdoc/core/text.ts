import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'
import { parse } from 'node-html-parser'
import { deserializeNode, serializeNode } from '../../serialization.js'

/**
 * Transform a text Block into Slate Element
 */
export function transformText(element: Block): TBElement {
  const { data } = element
  const rootElement = parse(data?.text || '')
  const value = deserializeNode(rootElement, {}, element.type)
  const children = (Array.isArray(value)) ? value : [value]

  return {
    id: element.id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    type: element.type,
    properties: element.role ? { role: element.role } : {},
    class: 'text',
    children
  }
}

/**
 * Transform a Slate Element into a text Block
 */
export function revertText(element: TBElement): Block {
  const text = serializeNode(element)

  return Block.create({
    id: element.id,
    type: 'core/text',
    role: typeof element?.properties?.role === 'string' ? element.properties.role : '',
    data: { text }
  })
}
