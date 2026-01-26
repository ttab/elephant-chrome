import { Block } from '@ttab/elephant-api/newsdoc'
import { toString } from '../../lib/toString.js'
import type { TBElement } from '@ttab/textbit'
import type { Descendant } from 'slate'
import { transformSoftcrop, revertSoftcrop } from './softcrop.js'

export const transformImage = (element: Block): TBElement => {
  const { id, data, links, meta } = element

  const properties: Record<string, string> = {
    rel: links[0].rel,
    uri: links[0].uri,
    type: links[0].type,
    text: data.text,
    html_caption: data.html_caption,
    credit: links[0].data.credit,
    width: data.width,
    height: data.height,
    uploadId: links[0].uri.split('/').at(-1) || '',
    ...transformSoftcrop(meta) || {}
  }

  return {
    id: id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    class: 'block',
    type: 'core/image',
    properties,
    children: [
      {
        id: '',
        class: 'void',
        type: 'core/image/image',
        children: [{ text: '' }]
      },
      {
        class: 'text',
        type: 'core/image/text',
        children: [{ text: data.text ?? '' }]
      },
      {
        class: 'text',
        type: 'core/image/byline',
        children: [{ text: data.credit ?? '' }]
      }
    ]
  }
}

export function revertImage(element: TBElement): Block {
  const { id, properties, children } = element
  const textNode = (children as TBElement[])?.find((c) => c.type === 'core/image/text')
  const bylineNode = (children as TBElement[])?.find((c) => c.type === 'core/image/byline')
  const imageId = (properties?.uri as string).split('core://image/')[1]

  function getText(node: Descendant | undefined) {
    let text = ''
    let html_caption = ''
    let hasFormattedText = false

    if (node && 'children' in node && Array.isArray(node?.children)) {
      for (const child of node.children) {
        const formatted = Object.keys(child).find((key) => key.startsWith('core/'))

        if (child && 'text' in child && child?.text) {
          text += child.text

          if (!formatted) {
            html_caption += child.text
          }

          if (formatted) {
            hasFormattedText = true

            if (formatted === 'core/bold') {
              html_caption += `<strong>${child.text}</strong>`
            }

            if (formatted === 'core/italic') {
              html_caption += `<em>${child.text}</em>`
            }
          }
        }
      }
    }

    return {
      text,
      ...(hasFormattedText && { html_caption })
    }
  }

  const captionText = getText(textNode)
  const bylineText = getText(bylineNode)

  const links = [
    {
      type: 'core/image',
      rel: 'image',
      uri: toString(properties?.uri),
      uuid: imageId
    }
  ]

  if (bylineText.text.length > 0) {
    links.push(Block.create({
      rel: 'author',
      type: 'core/author',
      title: toString(bylineText.text),
      uuid: crypto.randomUUID()
    }))
  }

  const html_caption = toString(captionText.html_caption)
  const text = toString(captionText.text)

  const data: Record<string, string> = {
    ...(html_caption && { html_caption }),
    text,
    credit: toString(bylineText.text),
    height: toString(properties?.height),
    width: toString(properties?.width)
  }


  return Block.create({
    id,
    type: 'core/image',
    data,
    links,
    meta: revertSoftcrop(element)
  })
}
