import { NodeType, parse, type HTMLElement } from 'node-html-parser'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Text } from 'slate'
import type { TBElement, TBText } from '@ttab/textbit'
import escapeHTML from 'escape-html'
import { jsx } from 'slate-hyperscript'

interface PrintChild {
  text?: string
}

/**
 * Transform a text Block into Slate Element
 */
export function transformText(element: Block): TBElement {
  const { id, data } = element
  const rootElement = parse(data?.text || '')
  const value = deserializeNode(rootElement, {}, element.type)
  const children = element.type !== 'tt/print-text'
    ? (Array.isArray(value)) ? value : [value]
    : [
        {
          id: id || crypto.randomUUID(),
          class: 'text',
          type: 'tt/print-text/text',
          children: [{ text: element.data.text }]
        },
        {
          id: id || crypto.randomUUID(),
          class: 'text',
          type: 'tt/print-text/role',
          children: [{ text: element.role }]
        }
      ]

  return {
    id: element.id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    type: element.type,
    properties: element.role ? { role: element.role } : {},
    class: 'text',
    children
  }
}


/**
 * Transform a Slate Element into a text Block
 */
export function revertText(element: TBElement): Block {
  const text = serializeNode(element)
  const isPrintText = element.type === 'tt/print-text'

  if (isPrintText) {
    const printTextNode = element.children.find((child) => child.type === 'tt/print-text/text')
    const printText = (printTextNode?.children as PrintChild[] | undefined)?.[0]?.text ?? ''
    const printRoleNode = element.children.find((child) => child.type === 'tt/print-text/role')
    const printRole = (printRoleNode?.children as PrintChild[] | undefined)?.[0]?.text ?? ''

    return Block.create({
      id: element.id,
      type: 'tt/print-text',
      role: printRole,
      data: { text: printText }
    })
  }

  return Block.create({
    id: element.id,
    type: 'core/text',
    role: typeof element?.properties?.role === 'string' ? element.properties.role : '',
    data: { text }
  })
}


/**
 * Recursively serialize a text node into HTML.
 *
 * @param node {Descendant}
 * @returns Generated html string
 */
function serializeNode(node: TBElement | TBText): string {
  // If this is a text element we must handle supported leafs (strong, etc)
  if (Text.isText(node)) {
    let string = escapeHTML(node.text)

    const keys = Object.keys(node)

    // Support both bold and strong but always create strong
    if (keys.includes('core/bold') || keys.includes('core/strong')) {
      string = `<strong>${string}</strong>`
    }

    // Support both italic and em but always create em
    if (keys.includes('core/italic') || keys.includes('core/em')) {
      string = `<em>${string}</em>`
    }

    // This is the correct way, we should not use <u>, see more on
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
    if (keys.includes('core/underline')) {
      string = `<span class="underline">${string}</span>`
    }

    return string
  }

  // This is a html element, serialize it's children first
  const properties = typeof node?.properties === 'object' ? node?.properties : {}
  const serializedChildren = Object.values(node.children || {}).map((node) => serializeNode(node)).join('')

  // Then handle specific cases
  // NOTE: Add other/new supported inline elements here
  switch (node.type) {
    case 'core/link':
      return `<a href="${escapeHTML(encodeURI(properties.url as string || ''))}" id="${node.id || ''}">${serializedChildren}</a>`

    default:
      return serializedChildren
  }
}


function deserializeNode(el: HTMLElement, markAttributes: Record<string, boolean> = {}, type: string): Array<TBElement | TBText> | TBElement | TBText {
  if (el.nodeType === NodeType.TEXT_NODE) {
    return jsx('text', markAttributes, el.textContent === '\n' ? '' : el.textContent) as unknown as TBText
  }

  const nodeName = el.rawTagName?.toLowerCase()
  const nodeAttributes = { ...markAttributes }

  // Handle supported decorations
  switch (nodeName) {
    case 'strong':
      nodeAttributes['core/bold'] = true
      break

    case 'em':
      nodeAttributes['core/italic'] = true
      break

    // NOTE: Add other/new supported decorations here

    // FIXME: node-html-parser does not support style attribute of HTMLElement
    // case 'span':
    //   if (el.style.textDecoration === 'underline') {
    //     nodeAttributes['core/underline'] = true
    //   }
    //   break
  }

  const children = el.childNodes
    .map((node) => {
      return deserializeNode(node as HTMLElement, nodeAttributes, type)
    })
    .filter((el) => !!el)
    .flat()

  if (children.length === 0) {
    children.push(jsx('text', nodeAttributes, '') as unknown as TBText)
  }

  // NOTE: Add other/new supported inline elements here
  switch (nodeName) {
    case 'a':
      return {
        id: el.id,
        class: 'inline',
        type: 'core/link',
        properties: {
          url: decodeURI(el.getAttribute('href') || '')
        },
        children
      } as TBElement

    default:
      return children
  }
}
