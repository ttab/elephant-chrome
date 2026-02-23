import { createAssignmentPreprocessor } from '@/views/Assignments/preprocessor'
import type { DecoratorDataBase, DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import { Document } from '@ttab/elephant-api/newsdoc'

const range = { gte: '2026-02-01T00:00:00Z', lte: '2026-02-28T23:59:59Z' }
const preprocess = createAssignmentPreprocessor(range)

const makeDoc = (overrides: Partial<Parameters<typeof Document.create>[0]> = {}): DocumentStateWithDecorators<DecoratorDataBase> => ({
  document: Document.create({
    uuid: 'planning-1',
    type: 'core/planning-item',
    uri: 'core://planning/planning-1',
    ...overrides
  })
})

describe('createAssignmentPreprocessor', () => {
  it('should return empty array for empty input', () => {
    expect(preprocess([])).toEqual([])
  })

  it('should skip documents with no assignments', () => {
    const result = preprocess([makeDoc({
      meta: [{ type: 'core/newsvalue', value: '3' }]
    })])

    expect(result).toEqual([])
  })

  it('should skip assignments outside date range', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-01-15T00:00:00Z' }
      }]
    })])

    expect(result).toEqual([])
  })

  it('should skip assignments with no start_date', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: {}
      }]
    })])

    expect(result).toEqual([])
  })

  it('should flatten assignments within range into separate rows', () => {
    const result = preprocess([makeDoc({
      meta: [
        {
          type: 'core/assignment',
          title: 'First',
          data: { start_date: '2026-02-10T08:00:00Z' }
        },
        {
          type: 'core/assignment',
          title: 'Second',
          data: { start_date: '2026-02-15T10:00:00Z' }
        }
      ]
    })])

    expect(result).toHaveLength(2)
    expect(result[0]._preprocessed.assignmentTitle).toBe('First')
    expect(result[0]._assignmentIndex).toBe(0)
    expect(result[0].id).toBe('planning-1-assignment-0')
    expect(result[1]._preprocessed.assignmentTitle).toBe('Second')
    expect(result[1]._assignmentIndex).toBe(1)
    expect(result[1].id).toBe('planning-1-assignment-1')
  })

  it('should precompute document-level newsvalue and section', () => {
    const result = preprocess([makeDoc({
      meta: [
        { type: 'core/newsvalue', value: '5' },
        {
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z' }
        }
      ],
      links: [{ type: 'core/section', uuid: 'sec-1' }]
    })])

    expect(result[0]._preprocessed.newsvalue).toBe('5')
    expect(result[0]._preprocessed.sectionUuid).toBe('sec-1')
  })

  it('should extract assignment types, assignees, and deliverable uuid', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' },
        meta: [
          { type: 'core/assignment-type', value: 'text' }
        ],
        links: [
          { type: 'core/author', rel: 'assignee', uuid: 'author-1' },
          { type: 'core/author', rel: 'reporter', uuid: 'author-2' },
          { rel: 'deliverable', uuid: 'del-1' }
        ]
      }]
    })])

    expect(result[0]._preprocessed.assignmentTypes).toEqual(['text'])
    expect(result[0]._preprocessed.assigneeUuids).toEqual(['author-1'])
    expect(result[0]._preprocessed.deliverableUuid).toBe('del-1')
  })

  describe('getStart', () => {
    it('should return full_day for full day assignments', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T00:00:00Z', full_day: 'true' },
          meta: [{ type: 'core/assignment-type', value: 'text' }]
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('Heldag')
      expect(result[0]._preprocessed.startType).toBe('full_day')
    })

    it('should use start for picture/video types', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z', start: '2026-02-10T09:00:00Z' },
          meta: [{ type: 'core/assignment-type', value: 'picture' }]
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('2026-02-10T09:00:00Z')
      expect(result[0]._preprocessed.startType).toBe('start')
    })

    it('should fallback to ?? for picture type with no start', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z' },
          meta: [{ type: 'core/assignment-type', value: 'picture' }]
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('??')
      expect(result[0]._preprocessed.startType).toBe('unknown')
    })

    it('should prefer publish_slot for text type', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z', publish_slot: '14', start: '2026-02-10T09:00:00Z' },
          meta: [{ type: 'core/assignment-type', value: 'text' }]
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('14')
      expect(result[0]._preprocessed.startType).toBe('publish_slot')
    })

    it('should fall back to start for text type when no publish_slot', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z', start: '2026-02-10T09:00:00Z' },
          meta: [{ type: 'core/assignment-type', value: 'text' }]
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('2026-02-10T09:00:00Z')
      expect(result[0]._preprocessed.startType).toBe('start')
    })

    it('should return ?? for text type with no publish_slot or start', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z' },
          meta: [{ type: 'core/assignment-type', value: 'text' }]
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('??')
      expect(result[0]._preprocessed.startType).toBe('unknown')
    })

    it('should use start for unknown type when available', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z', start: '2026-02-10T11:00:00Z' }
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('2026-02-10T11:00:00Z')
      expect(result[0]._preprocessed.startType).toBe('unknown')
    })

    it('should return ?? for unknown type with no start', () => {
      const result = preprocess([makeDoc({
        meta: [{
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z' }
        }]
      })])

      expect(result[0]._preprocessed.startValue).toBe('??')
      expect(result[0]._preprocessed.startType).toBe('unknown')
    })
  })
})
