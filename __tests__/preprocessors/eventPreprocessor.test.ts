import { describe, it, expect } from 'vitest'
import { preprocessEventData } from '@/views/EventsOverview/preprocessor'
import type { DocumentStateWithDecorators, DecoratorDataBase } from '@/hooks/useRepositorySocket/types'
import { Document } from '@ttab/elephant-api/newsdoc'

const makeDoc = (overrides: Partial<Parameters<typeof Document.create>[0]> = {}): DocumentStateWithDecorators<DecoratorDataBase> => ({
  document: Document.create({
    uuid: 'event-1',
    type: 'core/event',
    uri: 'core://event/event-1',
    ...overrides
  })
})

describe('preprocessEventData', () => {
  it('should return empty array for empty input', () => {
    expect(preprocessEventData([])).toEqual([])
  })

  it('should extract newsvalue', () => {
    const result = preprocessEventData([makeDoc({
      meta: [{ type: 'core/newsvalue', value: '3' }]
    })])

    expect(result[0]._preprocessed.newsvalue).toBe('3')
  })

  it('should extract section uuid and title from links', () => {
    const result = preprocessEventData([makeDoc({
      links: [{ type: 'core/section', uuid: 'section-1', title: 'Sport' }]
    })])

    expect(result[0]._preprocessed.sectionUuid).toBe('section-1')
    expect(result[0]._preprocessed.sectionTitle).toBe('Sport')
  })

  it('should extract organiser title', () => {
    const result = preprocessEventData([makeDoc({
      links: [{ rel: 'organiser', title: 'FIFA' }]
    })])

    expect(result[0]._preprocessed.organiserTitle).toBe('FIFA')
  })

  it('should extract event start, end, and cancelled from core/event meta', () => {
    const result = preprocessEventData([makeDoc({
      meta: [{
        type: 'core/event',
        data: {
          start: '2026-02-12T10:00:00Z',
          end: '2026-02-12T12:00:00Z',
          cancelled: 'true'
        }
      }]
    })])

    expect(result[0]._preprocessed.eventStart).toBe('2026-02-12T10:00:00Z')
    expect(result[0]._preprocessed.eventEnd).toBe('2026-02-12T12:00:00Z')
    expect(result[0]._preprocessed.cancelled).toBe(true)
  })

  it('should set cancelled to false when not "true"', () => {
    const result = preprocessEventData([makeDoc({
      meta: [{ type: 'core/event', data: { start: '2026-02-12T10:00:00Z' } }]
    })])

    expect(result[0]._preprocessed.cancelled).toBe(false)
  })

  it('should handle missing meta and links gracefully', () => {
    const result = preprocessEventData([makeDoc()])

    expect(result[0]._preprocessed.newsvalue).toBeUndefined()
    expect(result[0]._preprocessed.sectionUuid).toBeUndefined()
    expect(result[0]._preprocessed.organiserTitle).toBeUndefined()
    expect(result[0]._preprocessed.eventStart).toBeUndefined()
    expect(result[0]._preprocessed.cancelled).toBe(false)
  })

  it('should preserve original document state via spread', () => {
    const input = makeDoc({ title: 'My Event' })
    const result = preprocessEventData([input])

    expect(result[0].document?.title).toBe('My Event')
    expect(result[0].document?.uuid).toBe('event-1')
  })
})
