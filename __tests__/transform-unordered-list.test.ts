import type { TBElement } from '@ttab/textbit'
import { revertUnorderedList, transformUnorderedList } from '../src-srv/utils/transformations/newsdoc/core/unorderedList'
import { Block } from '@ttab/elephant-api/newsdoc'

const unorderedListNewsDoc = Block.create({
  id: '2faca87e-e7c2-43d7-8c6d-72a1b003bc3e',
  type: 'core/unordered-list',
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

const unorderedListSlate: TBElement = {
  id: '2faca87e-e7c2-43d7-8c6d-72a1b003bc3e',
  class: 'text',
  type: 'core/unordered-list',
  children: [
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      class: 'text',
      type: 'core/unordered-list/list-item',
      children: [
        {
          text: 'List item one'
        }
      ]
    },
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      class: 'text',
      type: 'core/unordered-list/list-item',
      children: [
        {
          text: 'List item two'
        }
      ]
    },
    {
      id: '604713cd-1e36-43c5-a64d-3534d67b2bd9',
      class: 'text',
      type: 'core/unordered-list/list-item',
      children: [
        {
          text: 'List item three'
        }
      ]
    }
  ]
}


describe('Handles Unordered List', () => {
  it('transforms and reverts', () => {
    const transformedToSlate = transformUnorderedList(unorderedListNewsDoc as unknown as Block)
    expect(transformedToSlate).toEqual(unorderedListSlate)

    const revertedToNewsDoc = revertUnorderedList(transformedToSlate)
    expect(revertedToNewsDoc).toEqual(unorderedListNewsDoc)
  })
})
