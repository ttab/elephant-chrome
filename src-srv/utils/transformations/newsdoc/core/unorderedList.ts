import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'
import { toString } from '../../lib/toString.js'

export function transformUnorderedList(element: Block): TBElement {
  return {
    id: element.id || crypto.randomUUID(),
    class: 'text',
    type: 'core/unordered-list',
    children: element.content.map((child: Block) => {
      return {
        id: child.id || crypto.randomUUID(),
        class: 'text',
        type: 'core/unordered-list/list-item',
        children: [
          { text: child.data.text }
        ]
      }
    })
  }
}

export function revertUnorderedList(transformedList: TBElement): Block {
  return Block.create({
    id: transformedList.id || crypto.randomUUID(),
    type: transformedList.type,
    content: transformedList.children.map((item) => {
      return Block.create({
        id: toString(item.id),
        type: 'core/text',
        data: {
          text: Array.isArray(item.children) && item.children.length > 0 && typeof item.children[0] === 'object' && 'text' in item.children[0]
            ? item.children[0].text
            : ''
        }
      })
    })
  })
}
