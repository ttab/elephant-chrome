import type { TBElement } from '@ttab/textbit'
import { Block } from '@ttab/elephant-api/newsdoc'
import { revertList, transformOrderedList } from '@/shared/transformations/newsdoc/core'

const orderedListNewsDoc = Block.create({
  id: '2faca87e-e7c2-43d7-8c6d-72a1b003bc3e',
  type: 'core/ordered-list',
  content: [
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      type: 'core/text',
      data: {
        text: 'List item one'
      }
    },
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      type: 'core/text',
      data: {
        text: 'List item two'
      }
    },
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      type: 'core/text',
      data: {
        text: 'List item three'
      }
    }
  ]
})

const orderedListSlate: TBElement = {
  id: '2faca87e-e7c2-43d7-8c6d-72a1b003bc3e',
  class: 'text',
  type: 'core/ordered-list',
  children: [
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      class: 'text',
      type: 'core/ordered-list/list-item',
      children: [
        {
          text: 'List item one'
        }
      ]
    },
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      class: 'text',
      type: 'core/ordered-list/list-item',
      children: [
        {
          text: 'List item two'
        }
      ]
    },
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      class: 'text',
      type: 'core/ordered-list/list-item',
      children: [
        {
          text: 'List item three'
        }
      ]
    }
  ]
}


describe('Handles Ordered List', () => {
  it('transforms and reverts', () => {
    const transformedToSlate = transformOrderedList(orderedListNewsDoc as unknown as Block)
    expect(transformedToSlate).toEqual(orderedListSlate)

    const revertedToNewsDoc = revertList(transformedToSlate)
    expect(revertedToNewsDoc).toEqual(orderedListNewsDoc)
  })
})
