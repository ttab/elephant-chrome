import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { articleDocumentTemplate } from '@/shared/templates/articleDocumentTemplate'
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
    expect(doc.language).toBe('sv-se')
  })

  it('removes core/description from meta', () => {
    const payload = {
      meta: { 'core/description': ['desc'], foo: ['bar'] }
    }
    articleDocumentTemplate('id', payload as unknown as TemplatePayload)
    expect(payload.meta['core/description']).toBeUndefined()
  })

  it('sets core/story rel to subject', () => {
    const payload = {
      links: { 'core/story': [{ rel: 'story' }] }
    }
    articleDocumentTemplate('id', payload as unknown as TemplatePayload)
    expect(payload.links['core/story'][0].rel).toBe('subject')
  })

  it('includes TT content source link', () => {
    const doc = articleDocumentTemplate('id')
    const links = doc.links
    expect(links.some((l: Block) => l.type === 'core/content-source' && l.title === 'TT')).toBe(true)
  })

  it('matches inline snapshot with fixed date', () => {
    const fixedDate = new Date('2024-06-01T10:00:00.000Z')
    vi.setSystemTime(fixedDate)

    const doc = articleDocumentTemplate('test-article-id')

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
        "links": [
          {
            "content": [],
            "contenttype": "",
            "data": {},
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "source",
            "role": "",
            "sensitivity": "",
            "title": "TT",
            "type": "core/content-source",
            "uri": "tt://content-source/tt",
            "url": "",
            "uuid": "",
            "value": "",
          },
        ],
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
