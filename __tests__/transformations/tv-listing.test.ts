import type { TBElement } from '@ttab/textbit'
import { Block } from '@ttab/elephant-api/newsdoc'
import { revertTvListing, transformTvListing } from '@/shared/transformations/newsdoc/tt/tvListing'

const tvListingNewsDoc = Block.create({
  id: 'eee539ba-63bc-463d-a513-9b3f67cb467d',
  type: 'tt/tv-listing',
  links: [{ rel: 'channel', uri: 'tt://tv-channel/svt1' }],
  data: {
    channel: 'SVT1',
    day: 'Lördag',
    end_time: '22.30',
    time: '20.00',
    title: 'Melodifestivalen'
  }
})

const tvListingSlate: TBElement = {
  id: 'eee539ba-63bc-463d-a513-9b3f67cb467d',
  class: 'block',
  type: 'tt/tv-listing',
  properties: {
    channel: 'SVT1',
    day: 'Lördag',
    end_time: '22.30',
    time: '20.00',
    title: 'Melodifestivalen',
    uri: 'tt://tv-channel/svt1'
  },
  children: [
    {
      type: 'tt/tv-listing/title',
      class: 'text',
      children: [
        {
          text: 'Melodifestivalen'
        }
      ]
    },
    {
      type: 'tt/tv-listing/channel',
      class: 'text',
      children: [
        {
          text: 'SVT1'
        }
      ]
    },
    {
      type: 'tt/tv-listing/day',
      class: 'text',
      children: [
        {
          text: 'Lördag'
        }
      ]
    },
    {
      type: 'tt/tv-listing/time',
      class: 'text',
      children: [
        {
          text: '20.00'
        }
      ]
    },
    {
      type: 'tt/tv-listing/end_time',
      class: 'text',
      children: [
        {
          text: '22.30'
        }
      ]
    }
  ]
}


describe('Handles tt/tv-listing', () => {
  it('transforms and reverts', () => {
    const transformedToSlate = transformTvListing(tvListingNewsDoc)
    expect(transformedToSlate).toEqual(tvListingSlate)

    const revertedToNewsDoc = revertTvListing(transformedToSlate)
    expect(revertedToNewsDoc).toEqual(tvListingNewsDoc)
  })

  it('handles missing channel link gracefully', () => {
    const newsDocNoLink = Block.create({
      id: 'no-link-id',
      type: 'tt/tv-listing',
      links: [],
      data: {
        channel: 'SVT1',
        day: 'Lördag',
        end_time: '22.30',
        time: '20.00',
        title: 'Melodifestivalen'
      }
    })

    const slate = transformTvListing(newsDocNoLink)
    expect(slate.properties?.uri).toBe('')

    const reverted = revertTvListing(slate)
    expect(reverted.links).toEqual([])
  })

  it('preserves channel link through round-trip', () => {
    const slate = transformTvListing(tvListingNewsDoc)
    expect(slate.properties?.uri).toBe('tt://tv-channel/svt1')

    const newsDoc = revertTvListing(slate)
    expect(newsDoc.links).toHaveLength(1)
    expect(newsDoc.links[0]).toEqual(expect.objectContaining({ rel: 'channel', uri: 'tt://tv-channel/svt1' }))
  })
})
