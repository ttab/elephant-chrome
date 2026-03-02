import { editorialInfoDocumentTemplate } from '@/shared/templates/editorialInfoDocumentTemplate.js'
import type { TemplatePayload } from '@/shared/templates'
import { Block } from '@ttab/elephant-api/newsdoc'

describe('editorialInfoDocumentTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a document with correct basic properties', () => {
    const doc = editorialInfoDocumentTemplate('test-id-123')

    expect(doc.uuid).toBe('test-id-123')
    expect(doc.type).toBe('core/editorial-info')
    expect(doc.uri).toBe('core://editorial-info/test-id-123')
    expect(doc.language).toBe('sv-se')
  })

  it('sets title from payload when provided', () => {
    const payload: TemplatePayload = { title: 'Editorial Notice Title' }
    const doc = editorialInfoDocumentTemplate('id', payload)

    expect(doc.title).toBe('Editorial Notice Title')
  })

  it('creates default content structure with heading and text blocks', () => {
    const doc = editorialInfoDocumentTemplate('id')

    expect(doc.content).toHaveLength(2)
    expect(doc.content[0].type).toBe('core/text')
    expect(doc.content[0].role).toBe('heading-1')
    expect(doc.content[0].data.text).toBe('')
    expect(doc.content[1].type).toBe('core/text')
    expect(doc.content[1].data.text).toBe('')
  })

  it('always includes the Swedish warning note in meta', () => {
    const doc = editorialInfoDocumentTemplate('id')

    const noteEntry = doc.meta.find((m: Block) => m.type === 'core/note')
    expect(noteEntry).toBeDefined()
    expect(noteEntry?.data.text).toBe('Obs! Detta meddelande är inte avsett för publicering.')
    expect(noteEntry?.role).toBe('public')
  })

  it('includes slugline meta from payload', () => {
    const payload: TemplatePayload = {
      meta: {
        'tt/slugline': [Block.create({ type: 'tt/slugline', data: { text: 'URGENT' } })]
      }
    }
    const doc = editorialInfoDocumentTemplate('id', payload)

    expect(doc.meta.some((m: Block) => m.type === 'tt/slugline')).toBe(true)
  })

  it('includes section links from payload', () => {
    const payload: TemplatePayload = {
      links: {
        'core/section': [Block.create({ type: 'core/section', title: 'News Section' })]
      }
    }
    const doc = editorialInfoDocumentTemplate('id', payload)

    expect(doc.links.some((l: Block) => l.type === 'core/section')).toBe(true)
  })

  it('handles empty payload gracefully', () => {
    const doc = editorialInfoDocumentTemplate('id', {})

    expect(doc.title).toBe('')
    expect(doc.meta).toHaveLength(1)
    expect(doc.links).toHaveLength(0)
  })


  it('matches snapshot with fixed date', () => {
    const fixedDate = new Date('2024-06-01T10:00:00.000Z')
    vi.setSystemTime(fixedDate)
    const doc = editorialInfoDocumentTemplate('test-event-id')

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
        "meta": [
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "Obs! Detta meddelande är inte avsett för publicering.",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "public",
            "sensitivity": "",
            "title": "",
            "type": "core/note",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
        ],
        "title": "",
        "type": "core/editorial-info",
        "uri": "core://editorial-info/test-event-id",
        "url": "",
        "uuid": "test-event-id",
      }
    `)

    vi.useRealTimers()
  })
})
