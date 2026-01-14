import { Block } from '@ttab/elephant-api/newsdoc'
import { toString } from '../../lib/toString.js'
import type { TBElement } from '@ttab/textbit'
import type { Descendant } from 'slate'
import { transformSoftcrop, revertSoftcrop } from '../core/softcrop.js'

type EnvLike = { BASE_URL?: string }

// Utility to resolve BASE_URL from different environments
const resolveBaseUrl = (): string | undefined => {
  const viteEnv = typeof import.meta !== 'undefined'
    && (import.meta as ImportMeta & { env?: EnvLike }).env

  if (typeof process !== 'undefined' && process.env.BASE_URL) {
    return process.env.BASE_URL
  }

  if (viteEnv) return viteEnv.BASE_URL

  return '/'
}

export const transformVisual = (element: Block): TBElement => {
  const { id, data, links, meta } = element
  const mediaType = links[0]?.url?.includes('/media/graphic/') ? 'graphics' : 'images'
  const BASE_URL = resolveBaseUrl()

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
        id: '',
        type: 'tt/visual/image',
        class: 'void',
        children: [{ text: '' }]
      },
      {
        type: 'tt/visual/text',
        class: 'text',
        children: [{ text: data.caption ?? '' }]
      },
      {
        type: 'tt/visual/byline',
        class: 'text',
        children: [{ text: links[0].data.credit ?? '' }]
      }
    ]
  }
}

export function revertVisual(element: TBElement): Block {
  const { id, properties } = element
  const children = element.children as TBElement[] || undefined

  const textNode = children?.find((c) => c.type === 'tt/visual/text')
  const bylineNode = children?.find((c) => c.type === 'tt/visual/byline')

  function getText(node: Descendant | undefined) {
    let text = ''

    if (node && 'children' in node && Array.isArray(node?.children)) {
      for (const child of node.children) {
        const formatted = Object.keys(child).find((key) => key.startsWith('core/'))

        if (child && 'text' in child && child?.text) {
          if (!formatted) {
            text += child.text
          }

          if (formatted && formatted === 'core/bold') {
            text += `<strong>${child.text}</strong>`
          }

          if (formatted && formatted === 'core/italic') {
            text += `<em>${child.text}</em>`
          }
        }
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
    meta: revertSoftcrop(element),
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
