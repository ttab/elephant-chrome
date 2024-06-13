import { decode } from 'html-entities'
import { Block } from '@/protos/service.js'
import { type TBElement } from '@ttab/textbit'

export const transformVisual = (element: Block): TBElement => {
  const { id, data, links } = element
  return {
    id,
    class: 'block',
    type: 'tt/visual',
    properties: {
      // FIXME: This is a hack to get a viewable image,
      // we need authentication to view non-watermarked images
      href: links[0]?.url
        ?.replace('_NormalPreview.jpg', '_WatermarkPreview.jpg') ?? '',
      rel: links[0].rel,
      uri: links[0].uri,
      type: links[0].type,
      credit: links[0].data.credit,
      altText: data?.altText,
      text: data.caption,
      width: links[0].data.width,
      height: links[0].data.height,
      hiresScale: links[0].data.hiresScale
    },
    children: [
      {
        type: 'tt/visual/image',
        children: [{ text: '' }]
      },
      {
        type: 'tt/visual/text',
        children: [{ text: decode(data.caption) ?? '' }]
      },
      {
        type: 'tt/visual/byline',
        children: [{ text: decode(links[0].data.credit) ?? '' }]
      },
      {
        type: 'tt/visual/altText',
        children: [{ text: decode(data.altText) ?? '' }]
      }
    ]
  }
}

export function revertVisual(element: TBElement): Block {
  function toString(value: string | number | undefined): string {
    return (value ?? '').toString()
  }

  const { id, properties } = element
  return Block.create({
    id,
    type: 'tt/visual',
    data: {
      caption: toString(properties?.text),
      altText: toString(properties?.altText)
    },
    links: [
      {
        data: {
          credit: toString(properties?.credit),
          height: toString(properties?.height),
          hiresScale: toString(properties?.hiresScale),
          width: toString(properties?.width)
        },
        rel: toString(properties?.rel),
        type: toString(properties?.type),
        uri: toString(properties?.uri),
        // FIXME: This is a hack to revert the viewable image
        url: toString(properties?.href).replace('_WatermarkPreview.jpg', '_NormalPreview.jpg')
      }
    ]
  })
}
