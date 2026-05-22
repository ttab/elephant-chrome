import { vi } from 'vitest'
import { Block } from '@ttab/elephant-api/newsdoc'
import { articleDocumentTemplate } from '@/shared/templates/articleDocumentTemplate'
import { getSystemLanguage, setSystemLanguage } from '@/shared/getSystemLanguage'
import type { TemplatePayload } from '@/shared/templates'

describe('articleDocumentTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a document with correct id and type', () => {
    const doc = articleDocumentTemplate('abc123')
    expect(doc.uuid).toBe('abc123')
    expect(doc.type).toBe('core/article')
    expect(doc.uri).toBe('core://article/abc123')
    expect(doc.language).toBe(getSystemLanguage())
  })

  it('uses the current system language', () => {
    const original = getSystemLanguage()
    setSystemLanguage('nb-NO')
    const doc = articleDocumentTemplate('id')
    expect(doc.language).toBe('nb-NO')
    setSystemLanguage(original)
  })

  it('overrides system language when payload.language is set', () => {
    const original = getSystemLanguage()
    setSystemLanguage('nb-NO')
    const doc = articleDocumentTemplate('id', { language: 'nn-no' })
    expect(doc.language).toBe('nn-no')
    setSystemLanguage(original)
  })

  it('removes core/description from meta', () => {
    const payload: TemplatePayload = {
      meta: {
        'core/description': [
          Block.create({
            type: 'core/description',
            role: 'public',
            data: { text: 'desc' }
          })
        ]
      }
    }

    articleDocumentTemplate('id', payload)

    expect(payload.meta?.['core/description']).toBeUndefined()
  })

  it('sets core/story rel to subject', () => {
    const payload: TemplatePayload = {
      links: {
        'core/story': [
          Block.create({
            type: 'core/story',
            rel: 'story'
          })
        ]
      }
    }

    articleDocumentTemplate('id', payload)

    const storyLink = payload.links?.['core/story']?.[0]

    if (!storyLink) {
      throw new Error('Expected core/story link to exist on payload')
    }

    expect(storyLink.rel).toBe('subject')
  })

  it('passes through caller-provided content-source link', () => {
    const payload: TemplatePayload = {
      links: {
        'core/content-source': [
          Block.create({
            type: 'core/content-source',
            rel: 'source',
            uri: 'tt://content-source/ntb',
            title: 'NTB'
          })
        ]
      }
    }
    const doc = articleDocumentTemplate('id', payload)
    const source = doc.links.find((l: Block) => l.type === 'core/content-source')
    expect(source?.uri).toBe('tt://content-source/ntb')
    expect(source?.title).toBe('NTB')
  })

  it('omits content-source link when caller provides none', () => {
    const doc = articleDocumentTemplate('id')
    expect(doc.links.some((l: Block) => l.type === 'core/content-source')).toBe(false)
  })

  it('matches inline snapshot with fixed date', () => {
    const fixedDate = new Date('2024-06-01T10:00:00.000Z')
    vi.setSystemTime(fixedDate)

    const doc = articleDocumentTemplate('test-article-id', undefined, { hasVignette: true })

    expect(doc).toMatchInlineSnapshot(`
      {
        "content": [
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "heading-1",
            "sensitivity": "",
            "title": "",
            "type": "core/text",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "vignette",
            "sensitivity": "",
            "title": "",
            "type": "core/text",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "preamble",
            "sensitivity": "",
            "title": "",
            "type": "core/text",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "",
            "type": "core/text",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
        ],
        "language": "sv-se",
        "links": [],
        "meta": [],
        "title": "",
        "type": "core/article",
        "uri": "core://article/test-article-id",
        "url": "",
        "uuid": "test-article-id",
      }
    `)

    vi.useRealTimers()
  })
})
