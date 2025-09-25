import { Block } from '@ttab/elephant-api/newsdoc'
import { type TBElement } from '@ttab/textbit'
import { newsDocToSlate } from '../index.js'
import { toString } from '../../lib/toString.js'
import { revertText } from './text.js'

export const transformFactbox = (element: Block): TBElement => {
  const { id, data, title, content = [], links = [] } = element

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/factbox',
    properties: {
      byline: data?.byline,
      ...(data?.text !== undefined && { text: toString(data.text) }),
      ...(data?.original_updated !== undefined && { original_updated: data.original_updated }),
      ...(data?.original_version !== undefined && { original_version: data.original_version }),
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
      {
        id: crypto.randomUUID(),
        class: 'block',
        type: 'core/factbox/body',
        children: [
          ...newsDocToSlate(content)
        ]
      }
    ]
  }
}

interface FactboxChild {
  text?: string
}

interface Data {
  [key: string]: string
}

export function revertFactbox(element: TBElement): Block {
  const factboxTitle = element.children.find((child) => child.type === 'core/factbox/title')
  const factboxBody = element.children.find((child) => child.type === 'core/factbox/body')

  const title = (factboxTitle?.children as FactboxChild[] | undefined)?.[0]?.text ?? ''
  const body = (factboxBody?.children as FactboxChild[] | undefined)
    ?.map((child) => revertText(child as TBElement))

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

  return Block.create({
    id,
    type: 'core/factbox',
    title: toString(title),
    data,
    links: properties?.original_id
      ? [{
          rel: 'source',
          uuid: toString(properties?.original_id)
        }]
      : [],
    content: body
  })
}
