import type { TBElement } from '@ttab/textbit'
import { transformSoftcrop, revertSoftcrop } from '@/shared/transformations/newsdoc/core/softcrop'
import { Block } from '@ttab/elephant-api/newsdoc'

const softcropMetaBlock = Block.create({
  type: 'core/softcrop',
  data: {
    crop: '0 0 1 1',
    focus: '0.5 0.5'
  }
})

const imageElement: TBElement = {
  id: '2faca87e-e7c2-43d7-8c6d-72a1b003bc3e',
  class: 'block',
  type: 'core/image',
  properties: {
    crop: '0 0 1 1',
    focus: '0.5 0.5'
  },
  children: [{
    id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
    class: 'text',
    type: 'core/image/image',
    children: [{ text: '' }]
  }]
}


describe('Handles softcrop meta block array correctly', () => {
  it('transforms meta block to element properties', () => {
    expect(transformSoftcrop([softcropMetaBlock]))
      .toEqual(imageElement.properties)
  })

  it('reverts element properties to meta block array', () => {
    expect(revertSoftcrop(imageElement))
      .toEqual([softcropMetaBlock])
  })
})
