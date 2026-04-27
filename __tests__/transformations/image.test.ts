import type { TBElement } from '@ttab/textbit'
import { transformImage, revertImage } from '@/shared/transformations/newsdoc/core/image'
import { Block } from '@ttab/elephant-api/newsdoc'
import { sortDocument } from '../utils/sortDocument'

// Mock crypto.randomUUID
vi.spyOn(globalThis.crypto, 'randomUUID')
  .mockImplementation(() => 'random-uuid')

const imageNewsDoc = Block.create({
  id: 'image-123',
  type: 'core/image',
  data: {
    text: 'A test image caption',
    credit: 'Jane Smith',
    width: '800',
    height: '600'
  },
  links: [
    {
      rel: 'image',
      type: 'core/image',
      uri: 'core://image/abc-def-123',
      uuid: 'abc-def-123'
    }
  ],
  meta: []
})

const imageSlate: TBElement = {
  id: 'image-123',
  class: 'block',
  type: 'core/image',
  properties: {
    rel: 'image',
    uri: 'core://image/abc-def-123',
    url: '',
    src: '',
    type: 'core/image',
    text: 'A test image caption',
    html_caption: undefined,
    credit: undefined,
    width: '800',
    height: '600',
    uploadId: 'abc-def-123'
  },
  children: [
    {
      id: '',
      class: 'void',
      type: 'core/image/image',
      children: [{ text: '' }]
    },
    {
      type: 'core/image/text',
      class: 'text',
      children: [{ text: 'A test image caption' }]
    },
    {
      type: 'core/image/byline',
      class: 'text',
      children: [{ text: 'Jane Smith' }]
    }
  ]
}

describe('Image transformations', () => {
  it('transforms image from NewsDoc to Slate', () => {
    const transformed = transformImage(imageNewsDoc)
    expect(sortDocument(transformed)).toEqual(sortDocument(imageSlate))
  })

  it('reverts image from Slate to NewsDoc', () => {
    const reverted = revertImage(imageSlate)
    expect(sortDocument(reverted)).toEqual(sortDocument(imageNewsDoc))
  })

  it('handles round-trip transformation', () => {
    const transformed = transformImage(imageNewsDoc)
    const reverted = revertImage(transformed)
    expect(sortDocument(reverted)).toEqual(sortDocument(imageNewsDoc))
  })

  it('generates UUID when id is missing', () => {
    const newsDocWithoutId = Block.create({
      ...imageNewsDoc,
      id: undefined
    })
    const transformed = transformImage(newsDocWithoutId)
    expect(transformed.id).toBe('random-uuid')
  })

  it('extracts uploadId from uri', () => {
    const transformed = transformImage(imageNewsDoc)
    expect(transformed.properties?.uploadId).toBe('abc-def-123')
  })

  it('handles missing caption', () => {
    const newsDocWithoutCaption = Block.create({
      ...imageNewsDoc,
      data: {
        credit: 'Jane Smith',
        width: '800',
        height: '600'
      }
    })
    const transformed = transformImage(newsDocWithoutCaption)
    expect(transformed.children[1].children).toEqual([{ text: '' }])
  })

  it('handles missing html_caption', () => {
    const newsDocWithoutHtml = Block.create({
      ...imageNewsDoc,
      data: {
        text: 'Plain text caption',
        credit: 'Jane Smith',
        width: '800',
        height: '600'
      }
    })
    const transformed = transformImage(newsDocWithoutHtml)
    expect(transformed.properties?.html_caption).toBeUndefined()
    expect(transformed.children[1].children).toEqual([{ text: 'Plain text caption' }])
  })

  it('handles html_caption with formatting', () => {
    const newsDocWithHtml = Block.create({
      ...imageNewsDoc,
      data: {
        ...imageNewsDoc.data,
        html_caption: 'Caption with <strong>bold</strong> text'
      }
    })
    const transformed = transformImage(newsDocWithHtml)
    expect(transformed.properties?.html_caption).toBe('Caption with <strong>bold</strong> text')
  })

  it('handles missing credit', () => {
    const newsDocWithoutCredit = Block.create({
      ...imageNewsDoc,
      data: {
        ...imageNewsDoc.data,
        credit: undefined
      }
    })
    const transformed = transformImage(newsDocWithoutCredit)
    expect(transformed.children[2].children).toEqual([{ text: '' }])
  })

  it('includes softcrop data when present', () => {
    const newsDocWithSoftcrop = Block.create({
      ...imageNewsDoc,
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
    const transformed = transformImage(newsDocWithSoftcrop)
    expect(transformed.properties?.crop).toBe('0,0,100,100')
    expect(transformed.properties?.focus).toBe('50,50')
  })

  it('reverts softcrop data correctly', () => {
    const slateWithSoftcrop: TBElement = {
      ...imageSlate,
      properties: {
        ...imageSlate.properties,
        crop: '10,10,90,90',
        focus: '45,55'
      }
    }
    const reverted = revertImage(slateWithSoftcrop)
    const softcropBlock = reverted.meta.find((b) => b.type === 'core/softcrop')
    expect(softcropBlock?.data.crop).toBe('10,10,90,90')
    expect(softcropBlock?.data.focus).toBe('45,55')
  })

  it('does not create author link from byline text', () => {
    const reverted = revertImage(imageSlate)
    const authorLink = reverted.links.find((l) => l.rel === 'author')
    expect(authorLink).toBeUndefined()
  })

  it('handles empty children array', () => {
    const slateWithEmptyChildren: TBElement = {
      ...imageSlate,
      children: []
    }
    const reverted = revertImage(slateWithEmptyChildren)
    expect(reverted.data.text).toBe('')
    expect(reverted.data.credit).toBe('')
  })

  it('preserves all properties', () => {
    const transformed = transformImage(imageNewsDoc)
    expect(transformed.properties?.rel).toBe('image')
    expect(transformed.properties?.type).toBe('core/image')
    expect(transformed.properties?.uri).toBe('core://image/abc-def-123')
    expect(transformed.properties?.url).toBe('')
    expect(transformed.properties?.width).toBe('800')
    expect(transformed.properties?.height).toBe('600')
    expect(transformed.properties?.uploadId).toBe('abc-def-123')
  })

  it('preserves dimensions through round-trip', () => {
    const transformed = transformImage(imageNewsDoc)
    const reverted = revertImage(transformed)
    expect(reverted.data.width).toBe('800')
    expect(reverted.data.height).toBe('600')
  })

  it('handles complex html_caption with multiple formatting', () => {
    const newsDocWithFormattedCaption = Block.create({
      ...imageNewsDoc,
      data: {
        ...imageNewsDoc.data,
        html_caption: '<p><strong>Bold</strong> and <em>italic</em> text</p>'
      }
    })
    const transformed = transformImage(newsDocWithFormattedCaption)
    const reverted = revertImage(transformed)
    expect(reverted.data.text).toBeDefined()
  })

  it('extracts imageId correctly from various uri formats', () => {
    const newsDocWithDifferentUri = Block.create({
      ...imageNewsDoc,
      links: [
        {
          ...imageNewsDoc.links[0],
          uri: 'core://image/xyz-789'
        }
      ]
    })
    const transformed = transformImage(newsDocWithDifferentUri)
    const reverted = revertImage(transformed)
    const imageLink = reverted.links.find((l) => l.rel === 'image')
    expect(imageLink?.uuid).toBe('xyz-789')
  })

  it('round-trips url through transform and revert', () => {
    const newsDocWithUrl = Block.create({
      ...imageNewsDoc,
      links: [
        {
          ...imageNewsDoc.links[0],
          url: 'https://example.com/image.jpg'
        }
      ]
    })
    const transformed = transformImage(newsDocWithUrl)
    expect(transformed.properties?.url).toBe('https://example.com/image.jpg')

    const reverted = revertImage(transformed)
    const imageLink = reverted.links.find((l) => l.rel === 'image')
    expect(imageLink?.url).toBe('https://example.com/image.jpg')
  })

  it('throws when links array is empty', () => {
    const newsDocWithoutLinks = Block.create({
      ...imageNewsDoc,
      links: []
    })
    expect(() => transformImage(newsDocWithoutLinks)).toThrow()
  })

  it('maps link data credit to properties.credit', () => {
    const newsDocWithLinkCredit = Block.create({
      ...imageNewsDoc,
      links: [
        {
          ...imageNewsDoc.links[0],
          data: { credit: 'Photo Agency' }
        }
      ]
    })
    const transformed = transformImage(newsDocWithLinkCredit)
    expect(transformed.properties?.credit).toBe('Photo Agency')
    // Block-level data.credit goes to byline child text, not properties.credit
    expect(transformed.children[2].children).toEqual([{ text: 'Jane Smith' }])
  })

  it('produces empty uuid for non-core URI schemes', () => {
    const slateWithMediamanagerUri: TBElement = {
      ...imageSlate,
      properties: {
        ...imageSlate.properties,
        uri: 'mediamanager://image/ntb/xyz-789'
      }
    }
    const reverted = revertImage(slateWithMediamanagerUri)
    const imageLink = reverted.links.find((l) => l.rel === 'image')
    expect(imageLink?.uri).toBe('mediamanager://image/ntb/xyz-789')
    expect(imageLink?.uuid).toBe('')
  })

  it('round-trips NTB image with mediamanager URI, url, and link credit', () => {
    const ntbNewsDoc = Block.create({
      id: 'ntb-image-456',
      type: 'core/image',
      data: {
        text: 'NTB photo caption',
        credit: 'NTB Photographer',
        width: '1920',
        height: '1080'
      },
      links: [
        {
          rel: 'image',
          type: 'mediamanager/image',
          uri: 'mediamanager://image/ntb/ntb-456',
          uuid: 'ntb-456',
          url: 'https://example.com/ntb/preview.jpg',
          data: { credit: 'NTB Scanpix' }
        }
      ],
      meta: []
    })

    const transformed = transformImage(ntbNewsDoc)
    expect(transformed.properties?.uri).toBe('mediamanager://image/ntb/ntb-456')
    expect(transformed.properties?.url).toBe('https://example.com/ntb/preview.jpg')
    expect(transformed.properties?.credit).toBe('NTB Scanpix')
    expect(transformed.properties?.type).toBe('mediamanager/image')
    expect(transformed.properties?.rel).toBe('image')
    expect(transformed.children[1].children).toEqual([{ text: 'NTB photo caption' }])
    expect(transformed.children[2].children).toEqual([{ text: 'NTB Photographer' }])

    const reverted = revertImage(transformed)
    const imageLink = reverted.links.find((l) => l.rel === 'image')
    expect(imageLink?.uri).toBe('mediamanager://image/ntb/ntb-456')
    expect(imageLink?.url).toBe('https://example.com/ntb/preview.jpg')
    expect(imageLink?.type).toBe('mediamanager/image')
    // mediamanager:// URI produces empty uuid since it doesn't match core://image/ split
    expect(imageLink?.uuid).toBe('')
    expect(reverted.data.text).toBe('NTB photo caption')
    expect(reverted.data.credit).toBe('NTB Photographer')
  })

  it('exposes link url as properties.src so the Image plugin can render', () => {
    const ntbNewsDoc = Block.create({
      ...imageNewsDoc,
      links: [
        {
          ...imageNewsDoc.links[0],
          type: 'mediamanager/image',
          uri: 'mediamanager://image/ntb/abc',
          url: 'https://preview-cdn.example/image.jpg'
        }
      ]
    })

    const transformed = transformImage(ntbNewsDoc)
    expect(transformed.properties?.src).toBe('https://preview-cdn.example/image.jpg')
  })

  it('handles uri without image id', () => {
    const slateWithBadUri: TBElement = {
      ...imageSlate,
      properties: {
        ...imageSlate.properties,
        uri: 'core://image/'
      }
    }
    const reverted = revertImage(slateWithBadUri)
    const imageLink = reverted.links.find((l) => l.rel === 'image')
    expect(imageLink?.uuid).toBe('')
  })
})
