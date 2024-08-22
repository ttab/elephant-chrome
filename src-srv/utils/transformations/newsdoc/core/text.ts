import { decode, encode } from 'html-entities'
import { parse, type HTMLElement } from 'node-html-parser'
import { Block } from '@/protos/service.js'
import type { Text } from 'slate'
import {
  type TBElement,
  type TBText,
  TextbitElement
} from '@ttab/textbit'

// TODO: Could this be changed in textbit so we dont have to translate?
const translateList = {
  'heading-1': 'h1',
  'heading-2': 'h2',
  preamble: 'preamble',
  vignette: 'dateline'
}


const invertedTranslateList = {
  h1: 'heading-1',
  h2: 'heading-2',
  preamble: 'preamble',
  dateline: 'vignette'
}


const replace = (type: unknown, translateList: Record<string, string>): string => {
  if (typeof type !== 'string') {
    return ''
  }

  return translateList[type] || ''
}

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
  // TODO: Align properties.role to textbit? Use role instead of type?
  const properties = role ? { properties: { type: replace(role, translateList) } } : {}

  return {
    id: id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    class: 'text',
    type: 'core/text',
    ...properties,
    children: nodes.map((node): (TBElement | TBText) => {
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

export async function revertText(element: TBElement): Promise<Block> {
  const { id, children } = element

  const role = replace(element.properties?.type, invertedTranslateList)

  return Block.create({
    id,
    type: 'core/text',
    role,
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
