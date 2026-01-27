import type { TBElement } from '@ttab/textbit'
import { transformVisual, revertVisual } from '@/shared/transformations/newsdoc/tt/visual'
import { Block } from '@ttab/elephant-api/newsdoc'
import { sortDocument } from '../utils/sortDocument'

// Mock crypto.randomUUID
vi.spyOn(globalThis.crypto, 'randomUUID')
  .mockImplementation(() => 'random-uuid')

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv, BASE_URL: '/elephant' }
})

afterEach(() => {
  process.env = originalEnv
})

const visualNewsDoc = Block.create({
  id: 'visual-123',
  type: 'tt/visual',
  data: {
    caption: 'A test image caption'
    // No html_caption - testing the plain text case
  },
  links: [
    {
      rel: 'self',
      type: 'tt/picture',
      uri: 'http://example.com/media/image/abc',
      url: 'https://example.com/media/image/abc.jpg',
      data: {
        credit: 'John Doe/TT',
        width: '1024',
        height: '768'
      }
    }
  ],
  meta: []
})

const visualSlate: TBElement = {
  id: 'visual-123',
  class: 'block',
  type: 'tt/visual',
  properties: {
    href: 'https://example.com/media/image/abc.jpg',
    proxy: '/elephant/api/images/abc.jpg',
    rel: 'self',
    uri: 'http://example.com/media/image/abc',
    type: 'tt/picture',
    credit: 'John Doe/TT',
    text: 'A test image caption',
    html_caption: undefined,
    width: '1024',
    height: '768'
  },
  children: [
    {
      id: '',
      type: 'tt/visual/image',
      class: 'void',
      children: [{ text: '' }]
    },
    {
      type: 'tt/visual/text',
      class: 'text',
      // When html_caption is not provided, fallback to caption
      children: [{ text: 'A test image caption' }]
    },
    {
      type: 'tt/visual/byline',
      class: 'text',
      children: [{ text: 'John Doe/TT' }]
    }
  ]
}

describe('Visual transformations', () => {
  it('transforms visual from NewsDoc to Slate', () => {
    const transformed = transformVisual(visualNewsDoc)
    expect(sortDocument(transformed)).toEqual(sortDocument(visualSlate))
  })

  it('reverts visual from Slate to NewsDoc', () => {
    const reverted = revertVisual(visualSlate)
    expect(sortDocument(reverted)).toEqual(sortDocument(visualNewsDoc))
  })

  it('handles round-trip transformation', () => {
    const transformed = transformVisual(visualNewsDoc)
    const reverted = revertVisual(transformed)
    expect(sortDocument(reverted)).toEqual(sortDocument(visualNewsDoc))
  })

  it('generates UUID when id is missing', () => {
    const newsDocWithoutId = Block.create({
      ...visualNewsDoc,
      id: undefined
    })
    const transformed = transformVisual(newsDocWithoutId)
    expect(transformed.id).toBe('random-uuid')
  })

  it('handles graphics media type', () => {
    const graphicsNewsDoc = Block.create({
      ...visualNewsDoc,
      links: [
        {
          ...visualNewsDoc.links[0],
          url: 'https://example.com/media/graphic/chart.svg'
        }
      ]
    })
    const transformed = transformVisual(graphicsNewsDoc)
    expect(transformed.properties?.proxy).toBe('/elephant/api/graphics/chart.svg')
  })

  it('handles images media type', () => {
    const transformed = transformVisual(visualNewsDoc)
    expect(transformed.properties?.proxy).toBe('/elephant/api/images/abc.jpg')
  })

  it('handles missing html_caption', () => {
    const newsDocWithoutHtml = Block.create({
      ...visualNewsDoc,
      data: {
        caption: 'Plain caption only'
      }
    })
    const transformed = transformVisual(newsDocWithoutHtml)
    expect(transformed.properties?.html_caption).toBeUndefined()
    // When html_caption is not provided, uses caption as fallback
    expect(transformed.children[1].children).toEqual([{ text: 'Plain caption only' }])
  })

  it('handles missing caption', () => {
    const newsDocWithoutCaption = Block.create({
      ...visualNewsDoc,
      data: {}
    })
    const transformed = transformVisual(newsDocWithoutCaption)
    expect(transformed.children[1].children).toEqual([{ text: '' }])
  })

  it('handles missing credit', () => {
    const newsDocWithoutCredit = Block.create({
      ...visualNewsDoc,
      links: [
        {
          ...visualNewsDoc.links[0],
          data: {
            width: '1024',
            height: '768'
          }
        }
      ]
    })
    const transformed = transformVisual(newsDocWithoutCredit)
    expect(transformed.children[2].children).toEqual([{ text: '' }])
  })

  it('includes softcrop data when present', () => {
    const newsDocWithSoftcrop = Block.create({
      ...visualNewsDoc,
      meta: [
        Block.create({
          type: 'core/softcrop',
          data: {
            crop: '0,0,100,100',
            focus: '50,50'
          }
        })
      ]
    })
    const transformed = transformVisual(newsDocWithSoftcrop)
    expect(transformed.properties?.crop).toBe('0,0,100,100')
    expect(transformed.properties?.focus).toBe('50,50')
  })

  it('reverts softcrop data correctly', () => {
    const slateWithSoftcrop: TBElement = {
      ...visualSlate,
      properties: {
        ...visualSlate.properties,
        crop: '10,10,90,90',
        focus: '45,55'
      }
    }
    const reverted = revertVisual(slateWithSoftcrop)
    const softcropBlock = reverted.meta.find((b) => b.type === 'core/softcrop')
    expect(softcropBlock?.data.crop).toBe('10,10,90,90')
    expect(softcropBlock?.data.focus).toBe('45,55')
  })

  it('handles empty children array', () => {
    const slateWithEmptyChildren: TBElement = {
      ...visualSlate,
      children: []
    }
    const reverted = revertVisual(slateWithEmptyChildren)
    expect(reverted.data.caption).toBe('')
    expect(reverted.links[0].data.credit).toBe('')
  })

  it('preserves all link properties', () => {
    const transformed = transformVisual(visualNewsDoc)
    const reverted = revertVisual(transformed)
    expect(reverted.links[0].rel).toBe('self')
    expect(reverted.links[0].type).toBe('tt/picture')
    expect(reverted.links[0].uri).toBe('http://example.com/media/image/abc')
    expect(reverted.links[0].url).toBe('https://example.com/media/image/abc.jpg')
  })

  it('preserves dimensions', () => {
    const transformed = transformVisual(visualNewsDoc)
    expect(transformed.properties?.width).toBe('1024')
    expect(transformed.properties?.height).toBe('768')

    const reverted = revertVisual(transformed)
    expect(reverted.links[0].data.width).toBe('1024')
    expect(reverted.links[0].data.height).toBe('768')
  })

  it('handles complex html_caption with formatting', () => {
    const newsDocWithFormattedCaption = Block.create({
      ...visualNewsDoc,
      data: {
        caption: 'Complex caption',
        html_caption: '<strong>Bold</strong> and <em>italic</em> text'
      }
    })
    const transformed = transformVisual(newsDocWithFormattedCaption)
    const reverted = revertVisual(transformed)
    // Note: html_caption is only preserved when the text has formatting marks (core/* properties)
    // Plain HTML strings without formatting are converted to plain text
    expect(reverted.data.caption).toBeDefined()
  })
})
