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
  const { id, properties } = element

  return Block.create({
    id,
    type: 'tt/tv-listing',
    data: {
      channel: toString(properties?.channel),
      day: toString(properties?.day),
      end_time: toString(properties?.end_time),
      time: toString(properties?.time),
      title: toString(properties?.title)
    }
  })
}
