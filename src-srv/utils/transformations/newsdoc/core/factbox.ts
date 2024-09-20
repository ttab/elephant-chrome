import { decode } from 'html-entities'
import { Block } from '@ttab/elephant-api/newsdoc'
import { type TBElement } from '@ttab/textbit'

export const transformFactbox = (element: Block): TBElement => {
  const { id, data } = element
  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/factbox',
    properties: {
      modified: data.modified,
      title: data.title,
      text: data.text
    },
    children: [
      {
        type: 'core/factbox/title',
        children: [{ text: decode(data.title) ?? '' }]
      },
      {
        type: 'core/factbox/text',
        children: [{ text: decode(data.text) ?? '' }]
      }
    ]
  }
}

export function revertFactbox(element: TBElement): Block {
  function toString(value: string | number | boolean | undefined): string {
    return (value ?? '').toString()
  }

  const { id, properties } = element
  return Block.create({
    id,
    type: 'core/factbox',
    data: {
      modified: toString(properties?.modified),
      title: toString(properties?.title),
      text: toString(properties?.text)
    },
    links: [
      {
        data: {
          modified: toString(properties?.modified),
          title: toString(properties?.title),
          text: toString(properties?.text)
        }
      }
    ]
  })
}
