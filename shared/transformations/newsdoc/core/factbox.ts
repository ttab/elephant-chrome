import { Block } from '@ttab/elephant-api/newsdoc'
import { TextbitElement, type TBElement } from '@ttab/textbit'
import { newsDocToSlate } from '../index.js'
import { toString } from '../../lib/toString.js'
import { revertText } from './text.js'
import { revertList } from './lists.js'

const EMBEDDED_COMPOSITE = /:embedded:\d+$/

const isValidSourceUuid = (uuid: string | undefined): uuid is string => {
  return !!uuid && !EMBEDDED_COMPOSITE.test(uuid)
}

export const transformFactbox = (element: Block): TBElement => {
  const { id, data, title, content = [], links = [] } = element
  const sourceUuid = links[0]?.uuid

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/factbox',
    properties: {
      byline: data?.byline,
      ...(data?.text !== undefined && { text: toString(data.text) }),
      ...(data?.original_updated !== undefined && { original_updated: data.original_updated }),
      ...(data?.original_version !== undefined && { original_version: data.original_version }),
      ...(isValidSourceUuid(sourceUuid) && { original_id: sourceUuid })
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
  const factboxTitle = (element.children as TBElement[]).find((child) => {
    return TextbitElement.isElement(child) && child.type === 'core/factbox/title'
  })
  const factboxBody = (element.children as TBElement[]).find((child) => {
    return TextbitElement.isElement(child) && child.type === 'core/factbox/body'
  })

  const title = (factboxTitle?.children as FactboxChild[] | undefined)?.[0]?.text ?? ''
  const body = (factboxBody?.children as TBElement[] | undefined)
    ?.map((child) => {
      if (child.type === 'core/unordered-list' || child.type === 'core/ordered-list') {
        return revertList(child)
      }
      return revertText(child)
    })

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

  const sourceUuid = properties?.original_id ? toString(properties.original_id) : undefined

  return Block.create({
    id,
    type: 'core/factbox',
    title: toString(title),
    data,
    links: isValidSourceUuid(sourceUuid)
      ? [{ rel: 'source', uuid: sourceUuid }]
      : [],
    content: body
  })
}
