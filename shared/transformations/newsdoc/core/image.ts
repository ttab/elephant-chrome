import { Block } from '@ttab/elephant-api/newsdoc'
import { toString } from '../../lib/toString.js'
import type { TBElement } from '@ttab/textbit'
import { transformSoftcrop, revertSoftcrop } from './softcrop.js'
import { deserializeText, serializeText } from '../../serialization.js'

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
        ...deserializeText({ html_caption: data.html_caption, text: data.text || '' }),
        class: 'text',
        type: 'core/image/text'
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


  const captionText = serializeText(textNode)
  const bylineText = serializeText(bylineNode)

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
