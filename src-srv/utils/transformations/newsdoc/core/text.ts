import { decode, encode } from 'html-entities'
import { NodeType, parse, type HTMLElement } from 'node-html-parser'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Text } from 'slate'
import {
  type TBElement,
  type TBText,
  TextbitElement
} from '@ttab/textbit'


const createDomDocument = async (): Promise<Document> => {
  if (typeof window === 'undefined') {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM()
    return dom.window.document
  }

  return window.document
}

async function createAnchorElement(element: TBElement): Promise<string> {
  const document = await createDomDocument()

  const anchor = document.createElement('a')

  if (typeof element.properties?.url === 'string') {
    anchor.href = element.properties?.url
  }

  if (typeof element.id === 'string') {
    anchor.id = element.id
  }

  const children = element.children as Text[]
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

async function revertInlineElement(element: TBElement): Promise<string> {
  switch (element.type) {
    case 'core/link':
      return await createAnchorElement(element)
    default:
      throw new Error(`Inline element not implemented: ${element.type}`)
  }
}

export function transformText(element: Block): TBElement {
  const { id, data, role } = element
  const root = parse(data?.text || '')
  const nodes = root.childNodes as HTMLElement[]
  const properties = role ? { properties: { role } } : {}

  return {
    id: id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    class: 'text',
    type: 'core/text',
    ...properties,
    children: nodes.length
      ? nodes.map((node): (TBElement | TBText) => {
        if (node.nodeType === NodeType.ELEMENT_NODE) {
          return {
            class: 'inline',
            ...transformInlineElement(node)
          }
        }
        // Plain text
        if (node.nodeType === NodeType.TEXT_NODE) {
          return {
            text: decode(node.text)
          }
        }
        throw new Error('Unknown nodeType')
      })
      : [{ text: '' }]
  }
}

export async function revertText(element: TBElement): Promise<Block> {
  const { id, children } = element

  return Block.create({
    id,
    type: 'core/text',
    role: typeof element?.properties?.role === 'string' ? element.properties.role : '',
    data: {
      text: (await Promise.all(children.map(async (child: TBElement | Text) => {
        if (TextbitElement.isInline(child)) {
          return await revertInlineElement(child)
        }

        if (TextbitElement.isTextLeaf(child)) {
          return encode(child.text)
        }

        throw new Error('Unknown child')
      }))).join('')
    }
  })
}
