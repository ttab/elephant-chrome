import { describe, it, expect } from 'vitest'
import { preprocessPlanningData } from '@/views/PlanningOverview/preprocessor'
import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'
import { Document } from '@ttab/elephant-api/newsdoc'

const makeDoc = (overrides: Partial<Parameters<typeof Document.create>[0]> = {}): DocumentStateWithDecorators<DecoratorDataBase> => ({
  document: Document.create({
    uuid: 'planning-1',
    type: 'core/planning-item',
    uri: 'core://planning/planning-1',
    ...overrides
  })
})

describe('preprocessPlanningData', () => {
  it('should return empty array for empty input', () => {
    expect(preprocessPlanningData([])).toEqual([])
  })

  it('should extract newsvalue and slugline', () => {
    const result = preprocessPlanningData([makeDoc({
      meta: [
        { type: 'core/newsvalue', value: '4' },
        { type: 'tt/slugline', value: 'test-slug' }
      ]
    })])

    expect(result[0]._preprocessed.newsvalue).toBe('4')
    expect(result[0]._preprocessed.slugline).toBe('test-slug')
  })

  it('should extract section uuid and title', () => {
    const result = preprocessPlanningData([makeDoc({
      links: [{ type: 'core/section', uuid: 'sec-1', title: 'Inrikes' }]
    })])

    expect(result[0]._preprocessed.sectionUuid).toBe('sec-1')
    expect(result[0]._preprocessed.sectionTitle).toBe('Inrikes')
  })

  it('should extract assignees filtered by rel=assignee', () => {
    const result = preprocessPlanningData([makeDoc({
      meta: [{
        type: 'core/assignment',
        links: [
          { type: 'core/author', rel: 'assignee', uuid: 'author-1' },
          { type: 'core/author', rel: 'reporter', uuid: 'author-2' },
          { type: 'core/author', rel: 'assignee', uuid: 'author-3' }
        ]
      }]
    })])

    expect(result[0]._preprocessed.assignees).toEqual(['author-1', 'author-3'])
  })

  it('should extract assignment types', () => {
    const result = preprocessPlanningData([makeDoc({
      meta: [{
        type: 'core/assignment',
        meta: [
          { type: 'core/assignment-type', value: 'text' },
          { type: 'core/assignment-type', value: 'picture' }
        ]
      }]
    })])

    expect(result[0]._preprocessed.types).toEqual(['text', 'picture'])
  })

  it('should extract deliverable UUIDs', () => {
    const result = preprocessPlanningData([makeDoc({
      meta: [{
        type: 'core/assignment',
        links: [
          { rel: 'deliverable', uuid: 'del-1' },
          { rel: 'other', uuid: 'other-1' },
          { rel: 'deliverable', uuid: 'del-2' }
        ]
      }]
    })])

    expect(result[0]._preprocessed.deliverableUuids).toEqual(['del-1', 'del-2'])
  })

  it('should return empty arrays when no assignments', () => {
    const result = preprocessPlanningData([makeDoc()])

    expect(result[0]._preprocessed.assignees).toEqual([])
    expect(result[0]._preprocessed.types).toEqual([])
    expect(result[0]._preprocessed.deliverableUuids).toEqual([])
  })

  it('should aggregate across multiple assignments', () => {
    const result = preprocessPlanningData([makeDoc({
      meta: [
        {
          type: 'core/assignment',
          links: [
            { type: 'core/author', rel: 'assignee', uuid: 'a-1' },
            { rel: 'deliverable', uuid: 'del-1' }
          ],
          meta: [{ type: 'core/assignment-type', value: 'text' }]
        },
        {
          type: 'core/assignment',
          links: [
            { type: 'core/author', rel: 'assignee', uuid: 'a-2' },
            { rel: 'deliverable', uuid: 'del-2' }
          ],
          meta: [{ type: 'core/assignment-type', value: 'picture' }]
        }
      ]
    })])

    expect(result[0]._preprocessed.assignees).toEqual(['a-1', 'a-2'])
    expect(result[0]._preprocessed.types).toEqual(['text', 'picture'])
    expect(result[0]._preprocessed.deliverableUuids).toEqual(['del-1', 'del-2'])
  })
})
