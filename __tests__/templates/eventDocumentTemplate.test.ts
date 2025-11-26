import { vi } from 'vitest'
import { eventDocumentTemplate } from '@/shared/templates/eventDocumentTemplate'
import type { Block } from '@ttab/elephant-api/newsdoc'

describe('eventDocumentTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a document with correct basic properties', () => {
    const doc = eventDocumentTemplate('event-123')

    expect(doc.uuid).toBe('event-123')
    expect(doc.type).toBe('core/event')
    expect(doc.uri).toBe('core://event/event-123')
    expect(doc.language).toBe('sv-se')
  })

  it('creates core/event meta block with correct date fields', () => {
    const doc = eventDocumentTemplate('id')

    const eventBlock = doc.meta.find((block: Block) => block.type === 'core/event')
    expect(eventBlock).toBeDefined()
    expect(eventBlock?.data.end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(eventBlock?.data.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(eventBlock?.data.registration).toBe('')
    expect(eventBlock?.data.dateGranularity).toBe('datetime')
  })

  it('creates core/newsvalue meta block with default value', () => {
    const doc = eventDocumentTemplate('id')

    const newsvalueBlock = doc.meta.find((block: Block) => block.type === 'core/newsvalue')
    expect(newsvalueBlock).toBeDefined()
    expect(newsvalueBlock?.value).toBe('3')
  })

  it('creates core/description meta block with empty text', () => {
    const doc = eventDocumentTemplate('id')

    const descriptionBlock = doc.meta.find((block: Block) => block.type === 'core/description')
    expect(descriptionBlock).toBeDefined()
    expect(descriptionBlock?.data.text).toBe('')
    expect(descriptionBlock?.role).toBe('public')
  })

  it('creates all three meta blocks', () => {
    const doc = eventDocumentTemplate('id')

    expect(doc.meta).toHaveLength(3)
    expect(doc.meta.some((block: Block) => block.type === 'core/event')).toBe(true)
    expect(doc.meta.some((block: Block) => block.type === 'core/newsvalue')).toBe(true)
    expect(doc.meta.some((block: Block) => block.type === 'core/description')).toBe(true)
  })

  it('sets start and end times to current date', () => {
    const beforeCall = new Date()
    const doc = eventDocumentTemplate('id')
    const afterCall = new Date()

    const eventBlock = doc.meta.find((block: Block) => block.type === 'core/event')
    const startTime = eventBlock?.data.start && new Date(eventBlock.data.start)
    const endTime = eventBlock?.data.start && new Date(eventBlock.data.end)

    if (!startTime || !endTime) {
      throw new Error('Start or end time is undefined')
    }

    expect(startTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
    expect(startTime.getTime()).toBeLessThanOrEqual(afterCall.getTime())
    expect(endTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
    expect(endTime.getTime()).toBeLessThanOrEqual(afterCall.getTime())
  })

  it('matches snapshot with fixed date', () => {
    const fixedDate = new Date('2024-06-01T10:00:00.000Z')
    vi.setSystemTime(fixedDate)

    const doc = eventDocumentTemplate('test-event-id')

    expect(doc).toMatchInlineSnapshot(`
      {
        "content": [],
        "language": "sv-se",
        "links": [],
        "meta": [
          {
            "content": [],
            "contenttype": "",
            "data": {
              "dateGranularity": "datetime",
              "end": "2024-06-01T10:00:00.000Z",
              "registration": "",
              "start": "2024-06-01T10:00:00.000Z",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "",
            "role": "",
            "sensitivity": "",
            "title": "",
            "type": "core/event",
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
            "value": "3",
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
            "role": "public",
            "sensitivity": "",
            "title": "",
            "type": "core/description",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "",
          },
        ],
        "title": "",
        "type": "core/event",
        "uri": "core://event/test-event-id",
        "url": "",
        "uuid": "test-event-id",
      }
    `)

    vi.useRealTimers()
  })
})
