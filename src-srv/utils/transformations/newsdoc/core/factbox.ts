import { Block } from '@ttab/elephant-api/newsdoc'
import { type TBElement } from '@ttab/textbit'
import { newsDocToSlate, slateToNewsDoc } from '../index.js'

export const transformFactbox = (element: Block): TBElement => {
  const { id, data, title, content, links } = element

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/factbox',
    properties: {
      byline: data?.byline,
      text: data?.text,
      original_updated: data?.original_updated,
      original_version: data?.original_version,
      locally_changed: data?.locally_changed,
      original_id: links[0]?.uuid
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

interface Data {
  [key: string]: string
}

export async function revertFactbox(element: TBElement): Promise<Block> {
  function toString(value: string | number | boolean | undefined): string {
    return (value ?? '').toString()
  }

  const factboxTitle = element.children.find((child) => child.type === 'core/factbox/title')
  const title = (factboxTitle?.children as FactboxChild[] | undefined)?.[0]?.text ?? ''

  const factboxChildren = element.children.filter((child) => child.type !== 'core/factbox/title')

  const { id, properties } = element

  const data: Data = {}

  // Adding properties conditionally instead of setting them from the get-go,
  // because of validation error; some fields cannot be left empty
  if (properties?.byline) {
    data.byline = toString(properties?.byline)
  }
  if (properties?.original_updated) {
    data.original_updated = toString(properties?.original_updated)
  }
  if (properties?.original_version) {
    data.original_version = toString(properties?.original_version)
  }
  if (properties?.locally_changed) {
    data.locally_changed = toString(properties?.locally_changed)
  }

  return Block.create({
    id,
    type: 'core/factbox',
    title: toString(title),
    data,
    links: [
      {
        rel: 'source',
        uuid: toString(properties?.original_id)
      }
    ],
    content: await slateToNewsDoc(factboxChildren as TBElement[])
  })
}
