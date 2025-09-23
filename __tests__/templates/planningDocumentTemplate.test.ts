import { describe, it, expect, vi } from 'vitest'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { planningDocumentTemplate } from '@/shared/templates/planningDocumentTemplate.js'
import type { TemplatePayload } from '@/shared/templates'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid-1234')
  }
})

describe('planningDocumentTemplate', () => {
  it('creates a document with correct basic properties', () => {
    const doc = planningDocumentTemplate('planning-123')

    expect(doc.uuid).toBe('planning-123')
    expect(doc.type).toBe('core/planning-item')
    expect(doc.uri).toBe('core://newscoverage/planning-123')
    expect(doc.language).toBe('sv-se')
  })

  it('sets title from payload when provided', () => {
    const doc = planningDocumentTemplate('id', { title: 'Planning Title' })
    expect(doc.title).toBe('Planning Title')
  })

  it('creates default planning-item meta block with current date', () => {
    const doc = planningDocumentTemplate('id')

    expect(doc.meta.some((block: Block) => block.type === 'core/planning-item')).toBe(true)
    const planningBlock = doc.meta.find((block: Block) => block.type === 'core/planning-item')
    expect(planningBlock?.data.public).toBe('true')
    expect(planningBlock?.data.tentative).toBe('false')
    expect(planningBlock?.data.end_date).toBe('2024-06-01')
    expect(planningBlock?.data.start_date).toBe('2024-06-01')
  })

  it('uses existing planning-item meta from payload', () => {
    const payload = {
      meta: {
        'core/planning-item': [{ type: 'core/planning-item', data: { custom: 'value' } }]
      }
    }
    const doc = planningDocumentTemplate('id', payload as unknown as TemplatePayload)

    expect(doc.meta).toContain(payload.meta['core/planning-item'][0])
  })

  it('creates default newsvalue meta block', () => {
    const doc = planningDocumentTemplate('id')

    expect(doc.meta.some((block: Block) => block.type === 'core/newsvalue')).toBe(true)
  })

  it('uses existing newsvalue meta from payload', () => {
    const payload = {
      meta: {
        'core/newsvalue': [{ type: 'core/newsvalue', value: '5' }]
      }
    }
    const doc = planningDocumentTemplate('id', payload as unknown as TemplatePayload)

    expect(doc.meta).toContain(payload.meta['core/newsvalue'][0])
  })

  it('creates default slugline meta block', () => {
    const doc = planningDocumentTemplate('id')

    expect(doc.meta.some((block: Block) => block.type === 'tt/slugline')).toBe(true)
  })

  it('uses existing public description from payload', () => {
    const payload = {
      meta: {
        'core/description': [
          { role: 'public', type: 'core/description', data: { text: 'Public desc' } },
          { role: 'internal', type: 'core/description', data: { text: 'Internal desc' } }
        ]
      }
    }
    const doc = planningDocumentTemplate('id', payload as unknown as TemplatePayload)

    const publicDesc = doc.meta.find((block: Block) => block.type === 'core/description' && block.role === 'public')
    expect(publicDesc?.data.text).toBe('Public desc')
  })

  it('creates default public description when not in payload', () => {
    const doc = planningDocumentTemplate('id')

    const publicDesc = doc.meta.find((block: Block) => block.type === 'core/description' && block.role === 'public')
    expect(publicDesc).toBeDefined()
    expect(publicDesc?.data.text).toBe('')
    expect(publicDesc?.role).toBe('public')
  })

  it('always creates internal description', () => {
    const doc = planningDocumentTemplate('id')

    const internalDesc = doc.meta.find((block: Block) => block.type === 'core/description' && block.role === 'internal')
    expect(internalDesc).toBeDefined()
    expect(internalDesc?.data.text).toBe('')
    expect(internalDesc?.role).toBe('internal')
  })

  it('includes links from payload', () => {
    const payload = {
      links: {
        'core/event': [{ type: 'core/event', title: 'Event' }],
        'core/story': [{ type: 'core/story', title: 'Story' }],
        'core/section': [{ type: 'core/section', title: 'Section' }]
      }
    }
    const doc = planningDocumentTemplate('id', payload as unknown as TemplatePayload)

    expect(doc.links).toContain(payload.links['core/event'][0])
    expect(doc.links).toContain(payload.links['core/story'][0])
    expect(doc.links).toContain(payload.links['core/section'][0])
  })

  it('extracts date from event payload', () => {
    const payload = {
      meta: {
        'core/event': [
          {
            type: 'core/event',
            data: {
              start: '2024-07-15T14:30:00.000Z',
              end: '2024-07-15T16:30:00.000Z'
            }
          }
        ]
      }
    }
    const doc = planningDocumentTemplate('id', payload as unknown as TemplatePayload)

    const planningBlock = doc.meta.find((block: Block) => block.type === 'core/planning-item')
    expect(planningBlock?.data.end_date).toBe('2024-07-15')
    expect(planningBlock?.data.start_date).toBe('2024-07-15')
  })

  it('uses start date when end date is not available in event', () => {
    const payload = {
      meta: {
        'core/event': [
          {
            type: 'core/event',
            data: {
              start: '2024-07-15T14:30:00.000Z'
            }
          }
        ]
      }
    }
    const doc = planningDocumentTemplate('id', payload as unknown as TemplatePayload)

    const planningBlock = doc.meta.find((block: Block) => block.type === 'core/planning-item')
    expect(planningBlock?.data.end_date).toBe('2024-07-15')
    expect(planningBlock?.data.start_date).toBe('2024-07-15')
  })

  it('matches inline snapshot', () => {
    const payload = {
      title: 'Planning Document with Event',
      meta: {
        'core/event': [
          {
            type: 'core/event',
            data: {
              start: '2024-07-15T14:30:00.000Z',
              end: '2024-07-15T16:30:00.000Z'
            }
          }
        ],
        'core/description': [
          { role: 'public', type: 'core/description', data: { text: 'Existing public description' } }
        ],
        'core/newsvalue': [{ type: 'core/newsvalue', value: '5' }],
        'tt/slugline': [{ type: 'tt/slugline', data: { text: 'BREAKING' } }]
      },
      links: {
        'core/event': [{ type: 'core/event', title: 'Conference Event', uuid: 'event-123' }],
        'core/story': [{ type: 'core/story', title: 'Main Story', uuid: 'story-456' }],
        'core/section': [{ type: 'core/section', title: 'Politics', uuid: 'section-789' }]
      }
    }

    const doc = planningDocumentTemplate('test-planning-id', payload as unknown as TemplatePayload)

    expect(doc).toMatchInlineSnapshot(`
      {
        "content": [],
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
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "Conference Event",
            "type": "core/event",
            "uri": "",
            "url": "",
            "uuid": "event-123",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {},
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "Main Story",
            "type": "core/story",
            "uri": "",
            "url": "",
            "uuid": "story-456",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {},
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "Politics",
            "type": "core/section",
            "uri": "",
            "url": "",
            "uuid": "section-789",
            "value": "",
          },
        ],
        "meta": [
          {
            "content": [],
            "contenttype": "",
            "data": {
              "end_date": "2024-07-15",
              "public": "true",
              "start_date": "2024-07-15",
              "tentative": "false",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "",
            "type": "core/planning-item",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {},
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "",
            "type": "core/newsvalue",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "5",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "BREAKING",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "",
            "type": "tt/slugline",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
          {
            "content": [],
            "contenttype": "",
            "data": {
              "text": "Existing public description",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "public",
            "sensitivity": "",
            "title": "",
            "type": "core/description",
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
            "role": "internal",
            "sensitivity": "",
            "title": "",
            "type": "core/description",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
        ],
        "title": "Planning Document with Event",
        "type": "core/planning-item",
        "uri": "core://newscoverage/test-planning-id",
        "url": "",
        "uuid": "test-planning-id",
      }
    `)
  })
})
