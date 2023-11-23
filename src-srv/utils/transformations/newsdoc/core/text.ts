import { decode, encode } from 'html-entities'
import { parse, type HTMLElement } from 'node-html-parser'
import { Block } from '../../../../protos/service.js'
import { JSDOM } from 'jsdom'
import {
  type TBDescendant,
  type TBElement,
  type TBText,
  TextbitElement
} from '@ttab/textbit'

import { invert } from 'lodash-es'

const translateList = {
  'core/heading-1': 'h1',
  'core/heading-2': 'h2',
  'core/preamble': 'preamble',
  'tt/dateline': 'dateline'
}

const replace = (type: string, translateList: Record<string, string>): string => {
  return translateList[type] ?? 'core/paragraph'
}

function createAnchorElement(element: TBElement): string {
  const dom = new JSDOM()
  const document = dom.window.document

  const anchor = document.createElement('a')
  if (typeof element.properties?.url === 'string') {
    anchor.href = element.properties?.url
  }
  if (typeof element.id === 'string') {
    anchor.id = element.id
  }

  const children = element.children as TBText[]
  if (typeof children[0].text === 'string') {
    anchor.textContent = children[0].text
  }

  return anchor.outerHTML
}

function transformInlineElement(node: HTMLElement): TBElement {
  switch (node.rawTagName) {
    case 'a':
      return {
        type: 'core/link',
        id: node.getAttribute('id'),
        properties: {
          url: node.getAttribute('href') ?? '',
          title: node.getAttribute('href') ?? '',
          target: '_blank'
        },
        children: [
          { text: decode(node.text) }
        ]
      }
    default:
      throw new Error(`Inline element not implemented: ${node.rawTagName}`)
  }
}

function revertInlineElement(element: TBElement): string {
  switch (element.type) {
    case 'core/link':
      return createAnchorElement(element)
    default:
      throw new Error(`Inline element not implemented: ${element.type}`)
  }
}

export function transformText(element: Block): TBElement {
  const { id, type, data } = element
  const root = parse(data.text)
  const nodes = root.childNodes as HTMLElement[]
  const properties = type !== 'core/paragraph' ? { properties: { type: replace(type, translateList) } } : {}

  return {
    id,
    class: 'text',
    type: 'core/text',
    ...properties,
    children: nodes.map((node): TBDescendant => {
      // Html entity
      if (node.nodeType === 1) {
        return {
          class: 'inline',
          ...transformInlineElement(node)
        }
      }
      // Plain text
      if (node.nodeType === 3) {
        return {
          text: decode(node.text)
        }
      }
      throw new Error('Unknown nodeType')
    })
  }
}

export function revertText(element: TBElement): Block {
  const { id, children } = element

  return Block.create({
    id,
    type: replace(element.properties?.type as string, invert(translateList)),
    data: {
      text: children.map((child: TBElement | TBText) => {
        if (TextbitElement.isInline(child)) {
          return revertInlineElement(child)
        }

        if (TextbitElement.isTextLeaf(child)) {
          return encode(child.text)
        }

        throw new Error('Unknown child')
      }).join('')
    }
  })
}
