import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'
import { toString } from '../../lib/toString.js'

export const transformTvListing = (element: Block): TBElement => {
  const { id, data } = element
  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'tt/tv-listing',
    properties: {
      channel: data.channel,
      day: data.day,
      end_time: data.end_time,
      time: data.time,
      title: data.title
    },
    children: [
      {
        type: 'tt/tv-listing/channel',
        children: [{ text: data.channel ?? '' }]
      },
      {
        type: 'tt/tv-listing/day',
        children: [{ text: data.day ?? '' }]
      },
      {
        type: 'tt/tv-listing/end_time',
        children: [{ text: data.end_time ?? '' }]
      },
      {
        type: 'tt/tv-listing/time',
        children: [{ text: data.time ?? '' }]
      },
      {
        type: 'tt/tv-listing/title',
        children: [{ text: data.title ?? '' }]
      }
    ]
  }
}

export function revertTvListing(element: TBElement): Block {
  const { id, children } = element

  const parseChildren = (children as TBElement[]).map((c) => {
    return {
      type: c.type,
      text: 'text' in c.children[0] ? c.children[0].text : ''
    }
  })

  const channel = parseChildren.find((c) => c.type === 'tt/tv-listing/channel')?.text
  const title = parseChildren.find((c) => c.type === 'tt/tv-listing/title')?.text
  const time = parseChildren.find((c) => c.type === 'tt/tv-listing/time')?.text
  const end_time = parseChildren.find((c) => c.type === 'tt/tv-listing/end_time')?.text
  const day = parseChildren.find((c) => c.type === 'tt/tv-listing/day')?.text

  return Block.create({
    id,
    type: 'tt/tv-listing',
    links: [{
      rel: 'self',
      uri: `tt://tv-listing/${id}`
    }],
    data: {
      channel: toString(channel),
      day: toString(day),
      end_time: toString(end_time),
      time: toString(time),
      title: toString(title)
    }
  })
}
