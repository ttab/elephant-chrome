import type { TBElement } from '@ttab/textbit'
import { Block } from '@ttab/elephant-api/newsdoc'
import { revertTvListing, transformTvListing } from '@/shared/transformations/newsdoc/tt/tvListing'

const tvListingNewsDoc = Block.create({
  id: 'eee539ba-63bc-463d-a513-9b3f67cb467d',
  type: 'tt/tv-listing',
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
    title: 'Melodifestivalen'
  },
  children: [
    {
      type: 'tt/tv-listing/channel',
      children: [
        {
          text: 'SVT1'
        }
      ]
    },
    {
      type: 'tt/tv-listing/day',
      children: [
        {
          text: 'Lördag'
        }
      ]
    },
    {
      type: 'tt/tv-listing/end_time',
      children: [
        {
          text: '22.30'
        }
      ]
    },
    {
      type: 'tt/tv-listing/time',
      children: [
        {
          text: '20.00'
        }
      ]
    },
    {
      type: 'tt/tv-listing/title',
      children: [
        {
          text: 'Melodifestivalen'
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
})
