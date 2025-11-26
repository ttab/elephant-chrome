import { vi } from 'vitest'
import type { TBElement } from '@ttab/textbit'
import { revertFactbox, transformFactbox } from '@/shared/transformations/newsdoc/core/factbox'
import { Block } from '@ttab/elephant-api/newsdoc'
import { sortDocument } from '../utils/sortDocument'

vi.spyOn(globalThis.crypto, 'randomUUID')
  .mockImplementation(() => 'random-uuid')

const factboxNewsDoc = Block.create({
  title: 'Title',
  type: 'core/factbox',
  content: [
    Block.create({
      data: {
        text: 'Body paragraph 1'
      },
      id: 'edd9c35e-6db8-40f2-809c-da439379f01e',
      type: 'core/text'
    }),
    Block.create({
      data: {
        text: 'Body paragraph 2'
      },
      id: 'edd9c35e-6db8-40f2-809c-da439379f012',
      type: 'core/text'
    })
  ],
  data: {
    byline: '(TT)'
  },
  id: 'dcab3591-6bf5-48e1-9368-9934506eda55',
  links: [{
    rel: 'source',
    uuid: '863349ac-cd21-485a-9d24-96b0b88a09e5'
  }]
})

const factboxSlate: TBElement = {
  id: 'dcab3591-6bf5-48e1-9368-9934506eda55',
  class: 'block',
  type: 'core/factbox',
  properties: {
    byline: '(TT)',
    original_id: '863349ac-cd21-485a-9d24-96b0b88a09e5'
  },
  children: [
    {
      id: 'random-uuid',
      class: 'text',
      type: 'core/factbox/title',
      children: [
        {
          text: 'Title'
        }
      ]
    },
    {
      id: 'random-uuid',
      class: 'block',
      type: 'core/factbox/body',
      children: [
        {
          id: 'edd9c35e-6db8-40f2-809c-da439379f01e',
          type: 'core/text',
          properties: {},
          class: 'text',
          children: [
            {
              text: 'Body paragraph 1'
            }
          ]
        },
        {
          id: 'edd9c35e-6db8-40f2-809c-da439379f012',
          type: 'core/text',
          properties: {},
          class: 'text',
          children: [
            {
              text: 'Body paragraph 2'
            }
          ]
        }
      ]
    }
  ]
}


describe('Handles Factbox', () => {
  it('transforms and reverts', () => {
    const transformedToSlate = transformFactbox(factboxNewsDoc)
    expect(sortDocument(transformedToSlate)).toEqual(sortDocument(factboxSlate))

    const revertedToNewsDoc = revertFactbox(transformedToSlate)
    expect(sortDocument(revertedToNewsDoc)).toEqual(sortDocument(factboxNewsDoc))
  })
})
