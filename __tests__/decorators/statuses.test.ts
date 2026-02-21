import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStatusesDecorator } from '@/hooks/useRepositorySocket/decorators/statuses'
import type { Repository } from '@/shared/Repository'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
import { Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import type { StatusOverviewItem } from '@ttab/elephant-api/repository'

describe('createStatusesDecorator', () => {
  let mockRepository: Repository
  let mockGetStatuses: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetStatuses = vi.fn()

    mockRepository = {
      getStatuses: mockGetStatuses
    } as unknown as Repository
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have namespace "statuses"', () => {
    const decorator = createStatusesDecorator({ repository: mockRepository })
    expect(decorator.namespace).toBe('statuses')
  })

  describe('onInitialData', () => {
    it('should fetch statuses for all included document UUIDs', async () => {
      const statusItem: StatusOverviewItem = {
        uuid: 'included-1',
        name: 'done',
        version: BigInt(1)
      } as unknown as StatusOverviewItem

      mockGetStatuses.mockResolvedValue({
        items: [statusItem]
      })

      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item'
          }),
          includedDocuments: [
            { uuid: 'included-1' },
            { uuid: 'included-2' }
          ]
        }
      ]

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onInitialData!(documents, 'test-token')

      expect(mockGetStatuses).toHaveBeenCalledWith({
        uuids: ['included-1', 'included-2'],
        statuses: expect.any(Array) as string[],
        accessToken: 'test-token'
      })
      expect(result.get('included-1')).toBe(statusItem)
    })

    it('should return empty Map when no included documents', async () => {
      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item'
          }),
          includedDocuments: []
        }
      ]

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onInitialData!(documents, 'test-token')

      expect(result.size).toBe(0)
      expect(mockGetStatuses).not.toHaveBeenCalled()
    })

    it('should return empty Map when response has no items', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockGetStatuses.mockResolvedValue(null)

      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item'
          }),
          includedDocuments: [{ uuid: 'included-1' }]
        }
      ]

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onInitialData!(documents, 'test-token')

      expect(result.size).toBe(0)
      consoleWarnSpy.mockRestore()
    })

    it('should return empty Map when API throws', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockGetStatuses.mockRejectedValue(new Error('API error'))

      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item'
          }),
          includedDocuments: [{ uuid: 'included-1' }]
        }
      ]

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onInitialData!(documents, 'test-token')

      expect(result.size).toBe(0)
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    it('should pass known status keys to getStatuses', async () => {
      mockGetStatuses.mockResolvedValue({ items: [] })

      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item'
          }),
          includedDocuments: [{ uuid: 'included-1' }]
        }
      ]

      const decorator = createStatusesDecorator({ repository: mockRepository })
      await decorator.onInitialData!(documents, 'test-token')

      const calledStatuses = (mockGetStatuses.mock.calls[0][0] as { statuses: string[] }).statuses
      expect(calledStatuses).toContain('draft')
      expect(calledStatuses).toContain('done')
      expect(calledStatuses).toContain('approved')
      expect(calledStatuses).toContain('usable')
    })
  })

  describe('onUpdate', () => {
    it('should fetch status for inclusion update', async () => {
      const statusItem: StatusOverviewItem = {
        uuid: 'doc-1',
        name: 'approved',
        version: BigInt(2)
      } as unknown as StatusOverviewItem

      mockGetStatuses.mockResolvedValue({
        items: [statusItem]
      })

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article'
        }),
        included: true
      }

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onUpdate!(update, 'test-token')

      expect(mockGetStatuses).toHaveBeenCalledWith({
        uuids: ['doc-1'],
        statuses: expect.any(Array) as string[],
        accessToken: 'test-token'
      })
      expect(result).toBeInstanceOf(Map)
      expect((result as Map<string, StatusOverviewItem>).get('doc-1')).toBe(statusItem)
    })

    it('should return undefined for non-inclusion update', async () => {
      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/planning-item'
        }),
        included: false
      }

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onUpdate!(update, 'test-token')

      expect(result).toBeUndefined()
      expect(mockGetStatuses).not.toHaveBeenCalled()
    })

    it('should return empty Map when update has no document uuid', async () => {
      const update: DocumentUpdate = {
        setName: 'test-set',
        included: true
      }

      const decorator = createStatusesDecorator({ repository: mockRepository })
      const result = await decorator.onUpdate!(update, 'test-token')

      expect(result).toBeInstanceOf(Map)
      expect((result as Map<string, StatusOverviewItem>).size).toBe(0)
      expect(mockGetStatuses).not.toHaveBeenCalled()
    })
  })
})
