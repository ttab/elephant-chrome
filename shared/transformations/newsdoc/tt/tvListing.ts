import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'

export const transformTvListing = (element: Block): TBElement => {
  const { id, data, links } = element
  const properties: Record<string, string> = {}
  const children: TBElement[] = []
  const fields = ['title', 'channel', 'day', 'time', 'end_time']

  for (const field of fields) {
    const value = data?.[field]

    if (value) {
      properties[field] = value
      children.push({
        class: 'text',
        type: `tt/tv-listing/${field}`,
        children: [{ text: value }]
      })
    }
  }

  const uri = links?.find((l) => l.rel === 'channel')?.uri

  if (uri) {
    properties.uri = uri
  }

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'tt/tv-listing',
    properties,
    children
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

  const channelUri = element.properties?.uri as string | undefined
  const fieldValues: Record<string, unknown> = {
    title: parseChildren.find((c) => c.type === 'tt/tv-listing/title')?.text,
    channel: element.properties?.channel,
    day: parseChildren.find((c) => c.type === 'tt/tv-listing/day')?.text,
    time: parseChildren.find((c) => c.type === 'tt/tv-listing/time')?.text,
    end_time: parseChildren.find((c) => c.type === 'tt/tv-listing/end_time')?.text
  }

  const data: Record<string, string> = {}

  for (const [field, value] of Object.entries(fieldValues)) {
    if (value && typeof value === 'string') {
      data[field] = value
    }
  }

  return Block.create({
    id,
    type: 'tt/tv-listing',
    data,
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
