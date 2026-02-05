import type { Descendant } from 'slate'
import escapeHTML from 'escape-html'
import { jsx } from 'slate-hyperscript'
import { Text } from 'slate'
import { NodeType, parse, type HTMLElement } from 'node-html-parser'
import type { TBElement, TBText } from '@ttab/textbit'

/**
 * Serialize a Slate Descendant to plain text and HTML
 */
export function serializeText(node: Descendant | undefined): { text: string, html_caption?: string } {
  if (!node || !('children' in node) || !Array.isArray(node.children)) {
    return { text: '' }
  }

  let text = ''
  let html_caption = ''
  let hasFormattedText = false

  for (const child of node.children) {
    const formatted = Object.keys(child).find((key) => key.startsWith('core/'))

    if (child && 'text' in child && child?.text) {
      text += child.text

      if (formatted) {
        hasFormattedText = true
      }

      html_caption += serializeNode(child)
    }
  }

  return {
    text,
    ...(hasFormattedText && { html_caption })
  }
}

/**
 * Deserialize plain text or HTML back to Slate Descendant
 */
export function deserializeText(input: string | { text: string, html_caption?: string } | undefined | null): Descendant {
  if (!input) {
    return { children: [{ text: '' }] } as Descendant
  }

  const text = typeof input === 'string' ? input : input.text
  const html = typeof input === 'object' && input.html_caption ? input.html_caption : null

  if (!html) {
    return { children: [{ text: text || '' }] } as Descendant
  }

  const root = parse(html)
  const children = deserializeNode(root, {}, 'core/text')
  const childrenArray = Array.isArray(children) ? children : [children]

  return {
    children: childrenArray.length > 0 ? childrenArray : [{ text: text || '' }]
  } as Descendant
}

/**
 * Recursively serialize a text node into HTML.
 *
 * @param node {Descendant}
 * @returns Generated html string
 */
export function serializeNode(node: TBElement | TBText): string {
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
      return `<a href="${escapeHTML(encodeURI(properties.url as string || ''))}" id="${node.id || crypto.randomUUID()}">${serializedChildren}</a>`

    default:
      return serializedChildren
  }
}


export function deserializeNode(el: HTMLElement, markAttributes: Record<string, boolean> = {}, type: string): Array<TBElement | TBText> | TBElement | TBText {
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
        id: el.id || crypto.randomUUID(),
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
