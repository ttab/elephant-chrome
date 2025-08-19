import { Block } from '@ttab/elephant-api/newsdoc'
import { toString } from '../../lib/toString.js'
import type { TBElement } from '@ttab/textbit'
import type { Descendant } from 'slate'
import { transformSoftcrop, revertSoftblock } from '../core/softcrop.js'

// Construed way of making it work in both environments
const BASE_URL: string
  = typeof import.meta !== 'undefined'
    && typeof ((import.meta as unknown as { env?: { BASE_URL?: string } }).env) !== 'undefined'
    && typeof ((import.meta as unknown as { env: { BASE_URL?: string } }).env.BASE_URL) === 'string'
    ? (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
    : typeof process !== 'undefined' && process.env && typeof process.env.BASE_URL === 'string'
      ? process.env.BASE_URL
      : ''

export const transformVisual = (element: Block): TBElement => {
  const { id, data, links, meta } = element
  const mediaType = links[0]?.url?.includes('/media/graphic/') ? 'graphics' : 'images'

  const properties: Record<string, string> = {
    href: links[0]?.url,
    proxy: `${BASE_URL}/api/${mediaType}/${links[0]?.url.split('/').pop()}`,
    rel: links[0].rel,
    uri: links[0].uri,
    type: links[0].type,
    credit: links[0].data.credit,
    text: data.caption,
    width: links[0].data.width,
    height: links[0].data.height,
    ...transformSoftcrop(meta) || {}
  }

  return {
    id: id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    class: 'block',
    type: 'tt/visual',
    properties,
    children: [
      {
        type: 'tt/visual/image',
        children: [{ text: '' }]
      },
      {
        type: 'tt/visual/text',
        children: [{ text: data.caption ?? '' }]
      },
      {
        type: 'tt/visual/byline',
        children: [{ text: links[0].data.credit ?? '' }]
      }
    ]
  }
}

export function revertVisual(element: TBElement): Block {
  const { id, properties, children } = element
  const textNode = children?.find((c) => c.type === 'tt/visual/text')
  const bylineNode = children?.find((c) => c.type === 'tt/visual/byline')

  function getText(node: Descendant | undefined) {
    let text = ''
    if (node && 'children' in node && Array.isArray(node?.children)) {
      const [child] = node.children

      if (child && 'text' in child && child?.text) {
        text = child.text
      }
    }
    return text
  }

  const captionText = getText(textNode)
  const bylineText = getText(bylineNode)

  const data: Record<string, string> = {
    credit: toString(bylineText),
    height: toString(properties?.height),
    width: toString(properties?.width)
  }

  return Block.create({
    id,
    type: 'tt/visual',
    data: {
      caption: toString(captionText)
    },
    meta: revertSoftblock(element),
    links: [
      {
        data,
        rel: toString(properties?.rel),
        type: toString(properties?.type),
        uri: toString(properties?.uri),
        url: toString(properties?.href)
      }
    ]
  })
}
