import { NodeType, parse, type HTMLElement } from 'node-html-parser'
import { Block } from '@ttab/elephant-api/newsdoc'
import { type Descendant, Text } from 'slate'
import type { TBElement } from '@ttab/textbit'
import escapeHTML from 'escape-html'
import { jsx } from 'slate-hyperscript'

/**
 * Transform a text Block into Slate Element
 */
export function transformText(element: Block): TBElement {
  const rootElement = parse(element?.data?.text || '')
  const value = deserializeNode(rootElement)

  return {
    id: element.id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    type: 'core/text',
    properties: element.role ? { role: element.role } : {},
    class: 'text',
    children: (Array.isArray(value)) ? value : [value]
  }
}


/**
 * Transform a Slate Element into a text Block
 */
export function revertText(element: TBElement): Block {
  const text = serializeNode(element)

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
function serializeNode(node: Descendant): string {
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


function deserializeNode(el: HTMLElement, markAttributes: Record<string, boolean> = {}): Descendant | Descendant[] {
  if (el.nodeType === NodeType.TEXT_NODE) {
    return jsx('text', markAttributes, el.textContent === '\n' ? '' : el.textContent)
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
    .map((node) => deserializeNode(node as HTMLElement, nodeAttributes))
    .filter((el) => !!el)
    .flat()

  if (children.length === 0) {
    children.push(jsx('text', nodeAttributes, ''))
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
      }

    default:
      return children
  }
}
