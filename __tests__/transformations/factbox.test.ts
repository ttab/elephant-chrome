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

describe('Factbox source uuid regex check', () => {
  // The regex guards against the composite ids that consume.ts produces for
  // article-embedded factboxes (`articleId:embedded:N`) ever being stored as
  // an `original_id` / source link — they are not valid UUIDs and the
  // repository rejects the document if they sneak through.

  it('drops a source link whose uuid is an embedded composite id on transformFactbox', () => {
    const block = Block.create({
      title: 'T',
      type: 'core/factbox',
      links: [{ rel: 'source', uuid: 'dcab3591-6bf5-48e1-9368-9934506eda55:embedded:0' }]
    })

    const slate = transformFactbox(block)
    expect(slate.properties?.original_id).toBeUndefined()
  })

  it('keeps a valid uuid as original_id on transformFactbox', () => {
    const block = Block.create({
      title: 'T',
      type: 'core/factbox',
      links: [{ rel: 'source', uuid: '863349ac-cd21-485a-9d24-96b0b88a09e5' }]
    })

    const slate = transformFactbox(block)
    expect(slate.properties?.original_id).toBe('863349ac-cd21-485a-9d24-96b0b88a09e5')
  })

  it('drops the source link on revertFactbox when properties.original_id is a composite id', () => {
    const slate: TBElement = {
      id: 'dcab3591-6bf5-48e1-9368-9934506eda55',
      class: 'block',
      type: 'core/factbox',
      properties: {
        original_id: 'dcab3591-6bf5-48e1-9368-9934506eda55:embedded:2'
      },
      children: [
        {
          id: 'random-uuid', class: 'text', type: 'core/factbox/title',
          children: [{ text: 'T' }]
        },
        {
          id: 'random-uuid', class: 'block', type: 'core/factbox/body',
          children: []
        }
      ]
    }

    const reverted = revertFactbox(slate)
    expect(reverted.links).toEqual([])
  })

  it('matches composite ids regardless of the prefix length (multi-digit index)', () => {
    const block = Block.create({
      title: 'T',
      type: 'core/factbox',
      links: [{ rel: 'source', uuid: 'any-prefix-here:embedded:42' }]
    })

    expect(transformFactbox(block).properties?.original_id).toBeUndefined()
  })

  it('does not reject a uuid that merely contains the substring "embedded" elsewhere', () => {
    // The regex is anchored to the end (`:embedded:\d+$`), so a uuid that happens
    // to contain the word "embedded" but doesn't match the composite suffix
    // must still be accepted.
    const uuid = 'embedded12-cd21-485a-9d24-96b0b88a09e5'
    const block = Block.create({
      title: 'T',
      type: 'core/factbox',
      links: [{ rel: 'source', uuid }]
    })

    expect(transformFactbox(block).properties?.original_id).toBe(uuid)
  })

  it('rejects an empty source uuid', () => {
    const block = Block.create({
      title: 'T',
      type: 'core/factbox',
      links: [{ rel: 'source', uuid: '' }]
    })

    expect(transformFactbox(block).properties?.original_id).toBeUndefined()
  })
})
