import { decode } from 'html-entities'
import { Block } from '@/protos/service.js'
import { type TBElement } from '@ttab/textbit'

export const transformVisual = (element: Block): TBElement => {
  const { id, data, links } = element
  return {
    id,
    class: 'block',
    type: 'core/image',
    properties: {
      // FIXME: This is a hack to get a viewable image
      // TODO: Could there be more than one link/image?
      src: links[0].url?.replace('_NormalPreview.jpg', '_WatermarkPreview.jpg') ?? '',
      rel: links[0].rel,
      uri: links[0].uri,
      type: links[0].type,
      credit: links[0].data.credit,
      altText: data.caption,
      text: data.caption,
      width: links[0].data.width,
      height: links[0].data.height,
      hiresScale: links[0].data.hiresScale
    },
    children: [
      {
        type: 'core/image/image',
        children: [{ text: '' }]
      },
      {
        type: 'core/image/altText',
        // TODO: Whats the difference between altText and text, and how should we handle them?
        children: [{ text: decode(data.caption) ?? '' }]
      },
      {
        type: 'core/image/text',
        children: [{ text: decode(data.caption) ?? '' }]
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
    // TODO: Fix once we have a coherent schema
    type: 'tt/visual',
    data: {
      caption: toString(properties?.text)
    },
    links: [
      Block.create({
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
        url: toString(properties?.src).replace('_WatermarkPreview.jpg', '_NormalPreview.jpg')
      })
    ]
  })
}
