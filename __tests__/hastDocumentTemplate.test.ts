import { hastDocumentTemplate } from '@/shared/templates/hastDocumentTemplate'
import { Block } from '@ttab/elephant-api/newsdoc'

describe('hastDocumentTemplate', () => {
  it('creates a core/article document with hast defaults', () => {
    const id = 'test-uuid-123'
    const doc = hastDocumentTemplate(id)

    expect(doc.uuid).toBe(id)
    expect(doc.type).toBe('core/article')
    expect(doc.uri).toBe(`core://article/${id}`)
    expect(doc.language).toBe('sv-se')
  })

  it('sets default newsvalue to 5', () => {
    const doc = hastDocumentTemplate('test-id')
    const newsvalue = doc.meta.find((m) => m.type === 'core/newsvalue')

    expect(newsvalue).toBeDefined()
    expect(newsvalue?.value).toBe('5')
  })

  it('sets default slugline to hast', () => {
    const doc = hastDocumentTemplate('test-id')
    const slugline = doc.meta.find((m) => m.type === 'tt/slugline')

    expect(slugline).toBeDefined()
    expect(slugline?.value).toBe('hast')
  })

  it('includes ntb/hast meta block', () => {
    const doc = hastDocumentTemplate('test-id')
    const hast = doc.meta.find((m) => m.type === 'ntb/hast')

    expect(hast).toBeDefined()
    expect(hast?.value).toBe('1')
  })

  it('creates content with heading and body text blocks', () => {
    const doc = hastDocumentTemplate('test-id')

    expect(doc.content).toHaveLength(3)
    expect(doc.content[0].type).toBe('core/text')
    expect(doc.content[0].role).toBe('heading-1')
    expect(doc.content[1].type).toBe('core/text')
    expect(doc.content[1].role).toBe('preamble')
    expect(doc.content[2].type).toBe('core/text')
    expect(doc.content[2].role).toBe('')
  })

  it('includes section links from payload', () => {
    const doc = hastDocumentTemplate('test-id', {
      links: {
        'core/section': [Block.create({
          type: 'core/section',
          uuid: 'section-1',
          title: 'Test Section',
          rel: 'section'
        })]
      }
    })

    expect(doc.links).toHaveLength(1)
    expect(doc.links[0].uuid).toBe('section-1')
  })
})
