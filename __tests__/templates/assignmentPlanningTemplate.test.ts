import type { Wire } from '@/shared/schemas/wire'
import { assignmentPlanningTemplate } from '@/shared/templates/assignmentPlanningTemplate'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { IDBAuthor } from 'src/datastore/types'
import { vi } from 'vitest'

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid-1234')
  }
})

const mockWire = {
  id: 'wire-1',
  fields: {
    'document.title': { values: ['Wire Title'] },
    current_version: { values: ['v1'] }
  }
}

const mockAssignee = {
  id: 'author-1',
  name: 'Jane Doe'
}

describe('assignmentPlanningTemplate', () => {
  const fixedDate = new Date('2024-06-01T10:00:00.000Z')
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a core/assignment block with correct fields', () => {
    const result = assignmentPlanningTemplate({
      assignmentType: 'text',
      planningDate: '2024-06-01',
      slugLine: 'slug',
      title: 'Assignment Title',
      wires: [mockWire] as unknown as Wire[],
      assignmentData: undefined,
      assignee: mockAssignee as unknown as IDBAuthor
    })
    expect(result.type).toBe('core/assignment')
    expect(result.title).toBe('Assignment Title')
    expect(result.meta.some((m: Block) => m.type === 'tt/slugline')).toBe(true)
    expect(result.links.some((l: Block) => l.type === 'tt/wire')).toBe(true)
    expect(result.links.some((l: Block) => l.type === 'core/author')).toBe(true)
  })

  it('sets publish_slot for text assignments if not present', () => {
    const assignmentData: Record<string, string> = {}
    assignmentPlanningTemplate({
      assignmentType: 'text',
      planningDate: '2024-06-01',
      assignee: null,
      assignmentData
    })
    expect(assignmentData.publish_slot).toBe('12')
  })

  it('does not set publish_slot for non-text assignments', () => {
    const assignmentData: Record<string, string> = {}
    assignmentPlanningTemplate({
      assignmentType: 'photo',
      planningDate: '2024-06-01',
      assignee: null,
      assignmentData
    })
    expect(assignmentData.publish_slot).toBeUndefined()
  })

  it('handles missing wire and assignee gracefully', () => {
    const result = assignmentPlanningTemplate({
      assignmentType: 'flash',
      planningDate: '2024-06-01',
      assignee: null
    })
    expect(result.links.length).toBe(0)
  })

  it('matches snapshot with fixed date', () => {
    const fixedDate = new Date('2024-01-01T10:00:00.000Z')
    vi.setSystemTime(fixedDate)

    const doc = assignmentPlanningTemplate({
      assignmentType: 'text',
      planningDate: '2024-06-01',
      slugLine: 'slug',
      title: 'Assignment Title',
      wires: [mockWire] as unknown as Wire[],
      assignmentData: undefined,
      assignee: mockAssignee as unknown as IDBAuthor
    })

    expect(doc).toMatchInlineSnapshot(`
      {
        "content": [],
        "contenttype": "",
        "data": {
          "end_date": "2024-06-01",
          "full_day": "false",
          "public": "true",
          "publish_slot": "11",
          "start": "2024-06-01T10:00:00.000Z",
          "start_date": "2024-06-01",
        },
        "id": "mocked-uuid-1234",
        "links": [
          {
            "content": [],
            "contenttype": "",
            "data": {
              "version": "v1",
            },
            "id": "",
            "links": [],
            "meta": [],
            "name": "",
            "rel": "source-document",
            "role": "",
            "sensitivity": "",
            "title": "Wire Title",
            "type": "tt/wire",
            "uri": "",
            "url": "",
            "uuid": "wire-1",
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
            "rel": "assignee",
            "role": "primary",
            "sensitivity": "",
            "title": "Jane Doe",
            "type": "core/author",
            "uri": "",
            "url": "",
            "uuid": "author-1",
            "value": "",
          },
        ],
        "meta": [
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
            "type": "tt/slugline",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "slug",
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
            "type": "core/assignment-type",
            "uri": "",
            "url": "",
            "uuid": "",
            "value": "text",
          },
        ],
        "name": "",
        "rel": "",
        "role": "",
        "sensitivity": "",
        "title": "Assignment Title",
        "type": "core/assignment",
        "uri": "",
        "url": "",
        "uuid": "",
        "value": "",
      }
    `)

    vi.useRealTimers()
  })
})
