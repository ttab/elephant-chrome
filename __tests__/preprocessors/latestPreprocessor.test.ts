import { preprocessLatestData } from '@/views/Latest/preprocessor'
import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { LatestDecorator } from '@/views/Latest/preprocessor'
import { Document } from '@ttab/elephant-api/newsdoc'
import { DocumentMeta } from '@ttab/elephant-api/repository'

const preprocess = preprocessLatestData

const metaWithUsable = DocumentMeta.create({
  created: '2026-02-10T08:00:00Z',
  modified: '2026-02-10T08:00:00Z',
  currentVersion: BigInt(1),
  heads: {
    usable: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2026-02-10T09:00:00Z',
      version: 3n,
      metaDocVersion: 1n
    }
  },
  acl: [],
  isMetaDocument: false
})

const metaWithoutUsable = DocumentMeta.create({
  created: '2026-02-10T08:00:00Z',
  modified: '2026-02-10T08:00:00Z',
  currentVersion: BigInt(1),
  heads: {},
  acl: [],
  isMetaDocument: false
})

const makeDoc = (overrides: Partial<Parameters<typeof Document.create>[0]> = {},
  options?: {
    includedDocuments?: DocumentStateWithDecorators<LatestDecorator>['includedDocuments']
  }
): DocumentStateWithDecorators<LatestDecorator> => ({
  document: Document.create({
    uuid: 'planning-1',
    type: 'core/planning-item',
    uri: 'core://planning/planning-1',
    ...overrides
  }),
  ...(options?.includedDocuments && { includedDocuments: options.includedDocuments })
})

describe('preprocessLatestData', () => {
  it('should return empty array for empty input', () => {
    expect(preprocess([])).toEqual([])
  })

  it('should skip documents with no assignments', () => {
    const result = preprocess([makeDoc({
      meta: [{ type: 'core/newsvalue', value: '3' }]
    })])

    expect(result).toEqual([])
  })

  it('should skip assignments without a deliverable link', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' }
      }]
    })])

    expect(result).toEqual([])
  })

  it('should skip assignments whose deliverable has no usable head', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' },
        links: [{ rel: 'deliverable', uuid: 'del-1' }]
      }]
    }, {
      includedDocuments: [{
        uuid: 'del-1',
        state: {
          document: Document.create({
            uuid: 'del-1',
            type: 'core/article',
            uri: 'core://article/del-1',
            title: 'My Article'
          }),
          meta: metaWithoutUsable
        }
      }]
    })])

    expect(result).toEqual([])
  })

  it('should create a row for assignment with published deliverable', () => {
    const result = preprocess([makeDoc({
      meta: [
        { type: 'tt/slugline', value: 'test-slug' },
        {
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z' },
          links: [{ rel: 'deliverable', uuid: 'del-1' }]
        }
      ],
      links: [{ type: 'core/section', uuid: 'sec-1', title: 'Sport' }]
    }, {
      includedDocuments: [{
        uuid: 'del-1',
        state: {
          document: Document.create({
            uuid: 'del-1',
            type: 'core/article',
            uri: 'core://article/del-1',
            title: 'My Article'
          }),
          meta: metaWithUsable
        }
      }]
    })])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('del-1')
    expect(result[0]._preprocessed.planningId).toBe('planning-1')
    expect(result[0]._preprocessed.deliverableUuid).toBe('del-1')
    expect(result[0]._preprocessed.title).toBe('My Article')
    expect(result[0]._preprocessed.slugline).toBe('test-slug')
    expect(result[0]._preprocessed.sectionTitle).toBe('Sport')
    expect(result[0]._preprocessed.sectionUuid).toBe('sec-1')
    expect(result[0]._preprocessed.documentType).toBe('core://article/del-1')
  })

  it('should create multiple rows for multiple assignments with published deliverables', () => {
    const result = preprocess([makeDoc({
      meta: [
        {
          type: 'core/assignment',
          data: { start_date: '2026-02-10T08:00:00Z' },
          links: [{ rel: 'deliverable', uuid: 'del-1' }]
        },
        {
          type: 'core/assignment',
          data: { start_date: '2026-02-10T10:00:00Z' },
          links: [{ rel: 'deliverable', uuid: 'del-2' }]
        }
      ]
    }, {
      includedDocuments: [
        {
          uuid: 'del-1',
          state: {
            document: Document.create({
              uuid: 'del-1',
              type: 'core/article',
              uri: 'core://article/del-1',
              title: 'First Article'
            }),
            meta: metaWithUsable
          }
        },
        {
          uuid: 'del-2',
          state: {
            document: Document.create({
              uuid: 'del-2',
              type: 'core/article',
              uri: 'core://article/del-2',
              title: 'Second Article'
            }),
            meta: metaWithUsable
          }
        }
      ]
    })])

    expect(result).toHaveLength(2)
    expect(result[0]._preprocessed.title).toBe('First Article')
    expect(result[0].id).toBe('del-1')
    expect(result[1]._preprocessed.title).toBe('Second Article')
    expect(result[1].id).toBe('del-2')
  })

  it('should extract document type from deliverable URI', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' },
        links: [{ rel: 'deliverable', uuid: 'del-1' }]
      }]
    }, {
      includedDocuments: [{
        uuid: 'del-1',
        state: {
          document: Document.create({
            uuid: 'del-1',
            type: 'core/flash',
            uri: 'core://flash/del-1',
            title: 'Flash News'
          }),
          meta: metaWithUsable
        }
      }]
    })])

    expect(result[0]._preprocessed.documentType).toBe('core://flash/del-1')
  })

  it('should use __updater.time for publish time when available', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' },
        links: [{ rel: 'deliverable', uuid: 'del-1' }]
      }]
    }, {
      includedDocuments: [{
        uuid: 'del-1',
        __updater: { sub: 'core://user/001', time: '2026-02-10T12:00:00Z' },
        state: {
          document: Document.create({
            uuid: 'del-1',
            type: 'core/article',
            uri: 'core://article/del-1',
            title: 'My Article'
          }),
          meta: metaWithUsable
        }
      }]
    })])

    expect(result[0]._preprocessed.publishTime).toBe('2026-02-10T12:00:00Z')
  })

  it('should fall back to usable head created time when no __updater', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' },
        links: [{ rel: 'deliverable', uuid: 'del-1' }]
      }]
    }, {
      includedDocuments: [{
        uuid: 'del-1',
        state: {
          document: Document.create({
            uuid: 'del-1',
            type: 'core/article',
            uri: 'core://article/del-1',
            title: 'My Article'
          }),
          meta: metaWithUsable
        }
      }]
    })])

    expect(result[0]._preprocessed.publishTime).toBe('2026-02-10T09:00:00Z')
  })

  it('should handle missing deliverable in includedDocuments', () => {
    const result = preprocess([makeDoc({
      meta: [{
        type: 'core/assignment',
        data: { start_date: '2026-02-10T08:00:00Z' },
        links: [{ rel: 'deliverable', uuid: 'del-missing' }]
      }]
    }, {
      includedDocuments: []
    })])

    expect(result).toEqual([])
  })
})
