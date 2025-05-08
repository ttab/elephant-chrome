import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'
import { toString } from '../../lib/toString.js'

// TODO: This only preserves the data structure of the element.
export const transformPrintArticle = (element: Block): TBElement => {
  const { id, title, name, data } = element
  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'tt/print-article',
    properties: {
      date: data.date,
      name,
      title,
      meta: JSON.stringify(element.meta)
    },
    children: [
    ]
  }
}

export function revertPrintArticle(element: TBElement): Block {
  const { id, properties } = element

  return Block.create({
    id,
    type: 'tt/print-article',
    title: toString(properties?.title),
    data: {
      date: toString(properties?.date)
    },
    name: toString(properties?.name),
    meta: JSON.parse(toString(properties?.meta)) as Block['meta']
  })
}
