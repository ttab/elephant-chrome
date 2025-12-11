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
        class: 'text',
        type: 'tt/tv-listing/title',
        children: [{ text: data.title ?? '' }]
      },
      {
        class: 'text',
        type: 'tt/tv-listing/channel',
        children: [{ text: data.channel ?? '' }]
      },
      {
        class: 'text',
        type: 'tt/tv-listing/day',
        children: [{ text: data.day ?? '' }]
      },
      {
        class: 'text',
        type: 'tt/tv-listing/time',
        children: [{ text: data.time ?? '' }]
      },
      {
        class: 'text',
        type: 'tt/tv-listing/end_time',
        children: [{ text: data.end_time ?? '' }]
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

  const channelName = element.properties?.channel
  const channelUri = element.properties?.uri as string || ''
  const title = parseChildren.find((c) => c.type === 'tt/tv-listing/title')?.text
  const time = parseChildren.find((c) => c.type === 'tt/tv-listing/time')?.text
  const end_time = parseChildren.find((c) => c.type === 'tt/tv-listing/end_time')?.text
  const day = parseChildren.find((c) => c.type === 'tt/tv-listing/day')?.text

  return Block.create({
    id,
    type: 'tt/tv-listing',
    data: {
      title: toString(title),
      channel: toString(channelName),
      day: toString(day),
      time: toString(time),
      end_time: toString(end_time)
    },
    links: channelUri
      ? [
          {
            rel: 'channel',
            uri: channelUri
          }
        ]
      : []
  })
}
