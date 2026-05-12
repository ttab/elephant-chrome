import { timelessArticleDocumentTemplate } from '@/shared/templates/timelessArticleDocumentTemplate'
import { getDeliverableType } from '@/shared/templates/lib/getDeliverableType'
import { getTemplateFromDeliverable } from '@/shared/templates/lib/getTemplateFromDeliverable'
import { isArticleType } from '@/lib/isArticleType'
import { Block } from '@ttab/elephant-api/newsdoc'

describe('timelessArticleDocumentTemplate', () => {
  it('creates a core/article#timeless document', () => {
    const id = 'test-uuid-123'
    const doc = timelessArticleDocumentTemplate(id)

    expect(doc.uuid).toBe(id)
    expect(doc.type).toBe('core/article#timeless')
    expect(doc.uri).toBe(`core://article/${id}`)
    expect(doc.language).toBe('sv-se')
  })

  it('creates article content structure', () => {
    const doc = timelessArticleDocumentTemplate('test-id')

    expect(doc.content).toHaveLength(4)
    expect(doc.content[0].role).toBe('heading-1')
    expect(doc.content[1].role).toBe('vignette')
    expect(doc.content[2].role).toBe('preamble')
    expect(doc.content[3].role).toBe('')
  })

  it('includes timeless-category link from payload', () => {
    const doc = timelessArticleDocumentTemplate('test-id', {
      links: {
        'core/timeless-category': [Block.create({
          type: 'core/timeless-category',
          uuid: 'cat-1',
          title: 'Background',
          rel: 'subject'
        })]
      }
    })

    const categoryLink = doc.links.find((l) => l.type === 'core/timeless-category')
    expect(categoryLink).toBeDefined()
    expect(categoryLink?.uuid).toBe('cat-1')
    expect(categoryLink?.rel).toBe('subject')
  })

  it('passes through caller-provided content-source link', () => {
    const doc = timelessArticleDocumentTemplate('test-id', {
      links: {
        'core/content-source': [Block.create({
          type: 'core/content-source',
          rel: 'source',
          uri: 'tt://content-source/npk',
          title: 'NPK'
        })]
      }
    })
    const source = doc.links.find((l) => l.type === 'core/content-source')

    expect(source?.uri).toBe('tt://content-source/npk')
    expect(source?.title).toBe('NPK')
  })

  it('omits content-source link when caller provides none', () => {
    const doc = timelessArticleDocumentTemplate('test-id')
    expect(doc.links.some((l) => l.type === 'core/content-source')).toBe(false)
  })

  it('pre-fills the heading-1 block with payload.title', () => {
    const doc = timelessArticleDocumentTemplate('test-id', { title: 'My timeless' })

    expect(doc.title).toBe('My timeless')
    expect(doc.content[0].role).toBe('heading-1')
    expect(doc.content[0].data.text).toBe('My timeless')
  })

  it('leaves the heading-1 block empty when no title is provided', () => {
    const doc = timelessArticleDocumentTemplate('test-id')

    expect(doc.content[0].role).toBe('heading-1')
    expect(doc.content[0].data.text).toBe('')
  })

  it('preserves the exact title string (no trimming) in heading-1 and root title', () => {
    const doc = timelessArticleDocumentTemplate('test-id', { title: '  spaced title  ' })

    expect(doc.title).toBe('  spaced title  ')
    expect(doc.content[0].data.text).toBe('  spaced title  ')
  })

  it('includes meta from payload', () => {
    const doc = timelessArticleDocumentTemplate('test-id', {
      meta: {
        'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '3' })],
        'tt/slugline': [Block.create({ type: 'tt/slugline', value: 'test-slug' })]
      }
    })

    expect(doc.meta.find((m) => m.type === 'core/newsvalue')?.value).toBe('3')
    expect(doc.meta.find((m) => m.type === 'tt/slugline')?.value).toBe('test-slug')
  })
})

describe('getDeliverableType', () => {
  it('maps timeless assignment type to timeless deliverable', () => {
    expect(getDeliverableType('timeless')).toBe('timeless')
  })

  it('maps text to article', () => {
    expect(getDeliverableType('text')).toBe('article')
  })
})

describe('getTemplateFromDeliverable', () => {
  it('returns timeless template for timeless type', () => {
    const template = getTemplateFromDeliverable('timeless')
    const doc = template('test-id', {})
    expect(doc.type).toBe('core/article#timeless')
  })
})

describe('isArticleType', () => {
  it('returns true for core/article', () => {
    expect(isArticleType('core/article')).toBe(true)
  })

  it('returns true for core/article#timeless', () => {
    expect(isArticleType('core/article#timeless')).toBe(true)
  })

  it('returns false for core/flash', () => {
    expect(isArticleType('core/flash')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isArticleType(undefined)).toBe(false)
  })
})
