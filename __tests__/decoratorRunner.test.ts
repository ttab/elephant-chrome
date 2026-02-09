import { describe, it, expect, vi } from 'vitest'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import type {
  Decorator,
  DocumentStateWithDecorators
} from '../src/hooks/useRepositorySocket/types'
import type { DocumentStateWithIncludes } from '../shared/RepositorySocket'
import {
  runInitialDecorators,
  runUpdateDecorators
} from '../src/hooks/useRepositorySocket/lib/decoratorRunner'
import { Document } from '@ttab/elephant-api/newsdoc'
import { DocumentMeta } from '@ttab/elephant-api/repository'

describe('decoratorRunner', () => {
  // Test data
  const mockMeta: DocumentMeta = DocumentMeta.create({
    created: '2025-01-01T00:00:00Z',
    modified: '2025-01-01T00:00:00Z',
    currentVersion: BigInt(1),
    heads: {},
    acl: [],
    isMetaDocument: false
  })

  const mockDocument: DocumentStateWithIncludes = {
    document: Document.create({
      uuid: 'doc-1',
      type: 'core/planning-item',
      title: 'Test Planning'
    }),
    includedDocuments: [
      {
        uuid: 'included-1',
        state: {
          document: Document.create({
            uuid: 'included-1',
            type: 'core/article'
          }),
          meta: mockMeta
        }
      }
    ],
    meta: mockMeta
  }

  const mockUpdate: DocumentUpdate = {
    setName: 'test',
    included: false,
    document: Document.create({
      uuid: 'doc-1',
      type: 'core/article',
      title: 'Updated Title'
    }),
    meta: mockMeta
  }

  describe('runInitialDecorators', () => {
    it('should return documents unchanged when no decorators provided', async () => {
      const result = await runInitialDecorators([mockDocument], [])
      expect(result).toEqual([mockDocument])
    })

    it('should run single decorator on initial batch', async () => {
      const mockDecorator: Decorator = {
        onInitialData: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', { charCount: 100 })
          map.set('included-1', { charCount: 50 })
          return Promise.resolve(map)
        })
      }

      const result = await runInitialDecorators([mockDocument], [mockDecorator])

      expect(mockDecorator.onInitialData).toHaveBeenCalledWith([mockDocument])
      expect(result[0].decoratorData).toEqual({
        'doc-1': { charCount: 100 },
        'included-1': { charCount: 50 }
      })
    })

    it('should run multiple decorators sequentially', async () => {
      const callOrder: string[] = []

      const decorator1: Decorator = {
        onInitialData: vi.fn(() => {
          callOrder.push('decorator1')
          const map = new Map()
          map.set('doc-1', { metric: 'value1' })
          return Promise.resolve(map)
        })
      }

      const decorator2: Decorator = {
        onInitialData: vi.fn(() => {
          callOrder.push('decorator2')
          const map = new Map()
          map.set('doc-1', { metric: 'value2' })
          return Promise.resolve(map)
        })
      }

      const result = await runInitialDecorators([mockDocument], [
        decorator1,
        decorator2
      ])

      expect(callOrder).toEqual(['decorator1', 'decorator2'])
      // Second decorator's data overwrites first for same UUID
      expect(result[0].decoratorData).toEqual({
        'doc-1': { metric: 'value2' }
      })
    })

    it('should skip decorators without onInitialData', async () => {
      const decorator1: Decorator = {
        onInitialData: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', { data: 'value' })
          return Promise.resolve(map)
        })
      }

      const decorator2: Decorator = {
        // No onInitialData method
      }

      const result = await runInitialDecorators([mockDocument], [
        decorator1,
        decorator2
      ])

      expect(decorator1.onInitialData).toHaveBeenCalled()
      expect(result[0].decoratorData).toEqual({
        'doc-1': { data: 'value' }
      })
    })

    it('should catch and log decorator errors silently', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const badDecorator: Decorator = {
        onInitialData: vi.fn(() => {
          throw new Error('Decorator crashed')
        })
      }

      const goodDecorator: Decorator = {
        onInitialData: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', { working: true })
          return Promise.resolve(map)
        })
      }

      const result = await runInitialDecorators([mockDocument], [
        badDecorator,
        goodDecorator
      ])

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(result[0].decoratorData).toEqual({
        'doc-1': { working: true }
      })

      consoleErrorSpy.mockRestore()
    })

    it('should only include UUIDs present in document state', async () => {
      const mockDecorator: Decorator = {
        onInitialData: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', { data: 'doc-1-data' })
          map.set('included-1', { data: 'included-1-data' })
          map.set('unknown-uuid', { data: 'should-not-appear' })
          return Promise.resolve(map)
        })
      }

      const result = await runInitialDecorators([mockDocument], [mockDecorator])

      expect(result[0].decoratorData).toEqual({
        'doc-1': { data: 'doc-1-data' },
        'included-1': { data: 'included-1-data' }
      })
      expect(result[0].decoratorData).not.toHaveProperty('unknown-uuid')
    })

    it('should handle multiple documents', async () => {
      const doc2: DocumentStateWithIncludes = {
        document: Document.create({
          uuid: 'doc-2',
          type: 'core/page',
          title: 'Page'
        }),
        includedDocuments: [],
        meta: mockMeta
      }

      const mockDecorator: Decorator = {
        onInitialData: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', { type: 'article' })
          map.set('doc-2', { type: 'page' })
          return Promise.resolve(map)
        })
      }

      const result = await runInitialDecorators(
        [mockDocument, doc2],
        [mockDecorator]
      )

      expect(result[0].decoratorData).toEqual({ 'doc-1': { type: 'article' } })
      expect(result[1].decoratorData).toEqual({ 'doc-2': { type: 'page' } })
    })

    it('should create shallow copies to trigger React re-renders', async () => {
      const result = await runInitialDecorators([mockDocument], [])

      // Result is a new array, but may reference same objects without decorators
      expect(result).not.toBe([mockDocument])
      expect(result[0].document).toBe(mockDocument.document) // Shallow copy
    })

    it('should handle empty decorator data map', async () => {
      const mockDecorator: Decorator = {
        onInitialData: vi.fn(() => Promise.resolve(new Map()))
      }

      const result = await runInitialDecorators([mockDocument], [mockDecorator])

      expect(result[0].decoratorData).toBeUndefined()
    })

    it('should handle undefined enrichment values', async () => {
      const mockDecorator: Decorator = {
        onInitialData: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', undefined)
          map.set('included-1', { data: 'value' })
          return Promise.resolve(map)
        })
      }

      const result = await runInitialDecorators([mockDocument], [mockDecorator])

      // undefined values should not be included
      expect(result[0].decoratorData).toEqual({
        'included-1': { data: 'value' }
      })
    })
  })

  describe('runUpdateDecorators', () => {
    const mockParent: DocumentStateWithDecorators = {
      document: Document.create({ uuid: 'doc-1', title: 'Test' }),
      includedDocuments: [],
      meta: mockMeta,
      decoratorData: {
        'doc-1': { oldData: 'old-value' },
        'other-uuid': { otherData: 'should-persist' }
      }
    }

    it('should return parent unchanged when no decorators provided', async () => {
      const result = await runUpdateDecorators(mockParent, mockUpdate, [])
      expect(result).toEqual(mockParent)
    })

    it('should return parent unchanged when update has no document UUID', async () => {
      const updateNoUuid: DocumentUpdate = {
        setName: 'test',
        included: false,
        document: Document.create({ type: 'core/article' }),
        meta: mockMeta
      }

      const mockDecorator: Decorator = {
        onUpdate: vi.fn()
      }

      const result = await runUpdateDecorators(mockParent, updateNoUuid, [
        mockDecorator
      ])

      expect(mockDecorator.onUpdate).not.toHaveBeenCalled()
      expect(result).toEqual(mockParent)
    })

    it('should run single decorator on update', async () => {
      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ charCount: 150 }))
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        mockDecorator
      ])

      expect(mockDecorator.onUpdate).toHaveBeenCalledWith(mockUpdate)
      expect(result.decoratorData).toEqual({
        'doc-1': { charCount: 150 },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should run multiple decorators sequentially', async () => {
      const callOrder: string[] = []

      const decorator1: Decorator = {
        onUpdate: vi.fn(() => {
          callOrder.push('decorator1')
          return Promise.resolve({ metric1: 'value1' })
        })
      }

      const decorator2: Decorator = {
        onUpdate: vi.fn(() => {
          callOrder.push('decorator2')
          return Promise.resolve({ metric2: 'value2' })
        })
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        decorator1,
        decorator2
      ])

      expect(callOrder).toEqual(['decorator1', 'decorator2'])
      // Each decorator spread overwrites previous for same UUID
      expect(result.decoratorData).toEqual({
        'doc-1': { metric2: 'value2' },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should skip decorators without onUpdate', async () => {
      const decorator1: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ data: 'value' }))
      }

      const decorator2: Decorator = {
        // No onUpdate method
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        decorator1,
        decorator2
      ])

      expect(decorator1.onUpdate).toHaveBeenCalled()
      expect(result.decoratorData).toEqual({
        'doc-1': { data: 'value' },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should handle Map return type from decorator', async () => {
      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => {
          const map = new Map()
          map.set('doc-1', { fromMap: 'value' })
          map.set('other-uuid', { shouldIgnore: 'value' })
          return Promise.resolve(map)
        })
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        mockDecorator
      ])

      // Should only use the value for updated document's UUID
      expect(result.decoratorData).toEqual({
        'doc-1': { fromMap: 'value' },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should handle Map with no entry for updated UUID', async () => {
      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => {
          const map = new Map()
          map.set('other-uuid', { data: 'value' })
          return Promise.resolve(map)
        })
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        mockDecorator
      ])

      // Should preserve existing data since Map has no entry for doc-1
      expect(result.decoratorData).toEqual({
        'doc-1': { oldData: 'old-value' },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should handle undefined return from decorator', async () => {
      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve(undefined))
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        mockDecorator
      ])

      // Should preserve existing decorator data when undefined
      expect(result.decoratorData).toEqual({
        'doc-1': { oldData: 'old-value' },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should preserve decorator data for other UUIDs on update', async () => {
      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ newData: 'new-value' }))
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        mockDecorator
      ])

      // Data for other-uuid should be preserved
      expect(result.decoratorData).toEqual({
        'doc-1': { newData: 'new-value' },
        'other-uuid': { otherData: 'should-persist' }
      })
    })

    it('should catch and log decorator errors silently', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const badDecorator: Decorator = {
        onUpdate: vi.fn(() => {
          throw new Error('Decorator crashed')
        })
      }

      const goodDecorator: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ working: true }))
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        badDecorator,
        goodDecorator
      ])

      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(result.decoratorData).toEqual({
        'doc-1': { working: true },
        'other-uuid': { otherData: 'should-persist' }
      })

      consoleWarnSpy.mockRestore()
    })

    it('should always create shallow copy of parent', async () => {
      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ data: 'value' }))
      }

      const result = await runUpdateDecorators(mockParent, mockUpdate, [
        mockDecorator
      ])

      // Spread operator creates new object reference when decorators run
      expect(result).not.toBe(mockParent)
      expect(result.document).toBe(mockParent.document) // Shallow copy
    })

    it('should initialize decoratorData if not present on parent', async () => {
      const parentNoDecorators: DocumentStateWithDecorators = {
        document: Document.create({ uuid: 'doc-1' }),
        includedDocuments: [],
        meta: mockMeta
      }

      const mockDecorator: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ data: 'value' }))
      }

      const result = await runUpdateDecorators(
        parentNoDecorators,
        mockUpdate,
        [mockDecorator]
      )

      expect(result.decoratorData).toEqual({
        'doc-1': { data: 'value' }
      })
    })

    it('should handle multiple sequential decorator updates accumulating data', async () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({ uuid: 'doc-1' }),
        includedDocuments: [],
        meta: mockMeta,
        decoratorData: { 'doc-1': { existing: 'data' } }
      }

      const decorator1: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ metric1: 'value1' }))
      }

      const decorator2: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ metric2: 'value2' }))
      }

      const result = await runUpdateDecorators(parent, mockUpdate, [
        decorator1,
        decorator2
      ])

      // Each decorator replaces decoratorData with spread, so only last decorator wins
      expect(result.decoratorData).toEqual({
        'doc-1': {
          metric2: 'value2'
        }
      })
    })

    it('should overwrite decorator data for same UUID across decorators', async () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({ uuid: 'doc-1' }),
        includedDocuments: [],
        meta: mockMeta,
        decoratorData: { 'doc-1': { metric: 'original' } }
      }

      const decorator1: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ metric: 'from-decorator1' }))
      }

      const decorator2: Decorator = {
        onUpdate: vi.fn(() => Promise.resolve({ metric: 'from-decorator2' }))
      }

      const result = await runUpdateDecorators(parent, mockUpdate, [
        decorator1,
        decorator2
      ])

      // Decorator 2 should overwrite decorator 1's value for same key
      expect(result.decoratorData).toEqual({
        'doc-1': { metric: 'from-decorator2' }
      })
    })
  })
})
