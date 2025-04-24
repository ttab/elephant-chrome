import { Block } from '@ttab/elephant-api/newsdoc'
import { toString } from '../../lib/toString.js'
import type { TBElement } from '@ttab/textbit'
import type { Descendant } from 'slate'

export const transformVisual = (element: Block): TBElement => {
  const { id, data, links } = element
  return {
    id: id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    class: 'block',
    type: 'tt/visual',
    properties: {
      // FIXME: This is a hack to get a viewable image,
      // we need authentication to view non-watermarked images
      href: links[0]?.url
        ?.replace('_NormalPreview.jpg', '_WatermarkPreview.jpg'),
      rel: links[0].rel,
      uri: links[0].uri,
      type: links[0].type,
      credit: links[0].data.credit,
      text: data.caption,
      width: links[0].data.width,
      height: links[0].data.height
    },
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

      if (child && 'text' in child) {
        text = child?.text
      }
    }
    return text
  }

  const captionText = getText(textNode)
  const bylineText = getText(bylineNode)

  return Block.create({
    id,
    type: 'tt/visual',
    data: {
      caption: toString(captionText)
    },
    links: [
      {
        data: {
          credit: toString(bylineText),
          height: toString(properties?.height),
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
