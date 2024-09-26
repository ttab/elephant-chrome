import { Block } from '@ttab/elephant-api/newsdoc'
import { type TBElement } from '@ttab/textbit'
import { newsDocToSlate, slateToNewsDoc } from '../index.js'

export const transformFactbox = (element: Block): TBElement => {
  const { id, data, title, content } = element
  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/factbox',
    properties: {
      byline: data.byline
    },
    children: [
      {
        id: crypto.randomUUID(),
        class: 'text',
        type: 'core/factbox/title',
        children: [
          {
            text: title
          }
        ]
      },
      ...newsDocToSlate(content)
    ]
  }
}

interface FactboxChild {
  text?: string
}

export async function revertFactbox(element: TBElement): Promise<Block> {
  function toString(value: string | number | boolean | undefined): string {
    return (value ?? '').toString()
  }

  const factboxTitle = element.children.find((child) => child.type === 'core/factbox/title')
  const title = (factboxTitle?.children as FactboxChild[] | undefined)?.[0]?.text ?? ''

  const factboxChildren = element.children.filter((child) => child.type !== 'core/factbox/title')


  const { id, properties } = element
  const byline = { byline: toString(properties?.byline) }
  return Block.create({
    id,
    type: 'core/factbox',
    title: toString(title),
    data: properties?.byline ? byline : {},
    content: await slateToNewsDoc(factboxChildren as TBElement[])
  })
}
