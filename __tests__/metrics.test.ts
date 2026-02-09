import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MetricsData } from '@/hooks/useRepositorySocket/decorators/metrics'
import { createMetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import type { Repository } from '@/shared/Repository'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
import * as nextAuth from 'next-auth/react'
import { Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import type { DocumentMeta } from '@ttab/elephant-api/repository'

describe('createMetricsDecorator', () => {
  let mockRepository: Repository
  let mockGetMetrics: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetMetrics = vi.fn()

    mockRepository = {
      getMetrics: mockGetMetrics
    } as unknown as Repository

    vi.mocked(nextAuth.getSession).mockResolvedValue({
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
      user: { name: 'Test User', sub: 'test-user-id', email: '', image: '', id: 'test-user-id' },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh',
      accessTokenExpires: Date.now() + 2 * 86400,
      status: 'authenticated',
      error: ''
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('onInitialData', () => {
    it('should fetch metrics for all included documents', async () => {
      // Arrange: Setup test data
      const testUuid1 = 'uuid-1'
      const testUuid2 = 'uuid-2'

      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-uuid',
            type: 'core/planning-item',
            uri: 'core://planning/parent-uuid',
            title: 'Test Planning'
          }),
          includedDocuments: [
            { uuid: testUuid1 },
            { uuid: testUuid2 }
          ]
        }
      ]

      // Setup mock response
      const mockMetricsResponse = {
        documents: {
          [testUuid1]: {
            metrics: [
              { kind: 'char_count', value: '1000' },
              { kind: 'word_count', value: '200' }
            ]
          },
          [testUuid2]: {
            metrics: [
              { kind: 'char_count', value: '1500' },
              { kind: 'word_count', value: '300' }
            ]
          }
        }
      }

      mockGetMetrics.mockResolvedValue(mockMetricsResponse)

      // Act: Create decorator and call onInitialData
      const decorator = createMetricsDecorator({
        kinds: ['char_count', 'word_count'],
        repository: mockRepository
      })

      const result = await decorator.onInitialData!(documents)

      // Assert: Verify getMetrics was called with correct parameters
      expect(mockGetMetrics).toHaveBeenCalledWith(
        [testUuid1, testUuid2],
        ['char_count', 'word_count'],
        'test-access-token'
      )

      // Assert: Verify result contains correct metrics data
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(2)
      expect(result.get(testUuid1)).toEqual({
        charCount: 1000,
        wordCount: 200
      })
      expect(result.get(testUuid2)).toEqual({
        charCount: 1500,
        wordCount: 300
      })
    })

    it('should return empty Map when no included documents', async () => {
      // Arrange: Documents with no included documents
      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-uuid',
            type: 'core/planning-item',
            uri: 'core://planning/parent-uuid',
            title: 'Test Planning'
          }),
          includedDocuments: []
        }
      ]

      // Act
      const decorator = createMetricsDecorator({
        repository: mockRepository
      })

      const result = await decorator.onInitialData!(documents)

      // Assert: Should not call getMetrics and return empty Map
      expect(mockGetMetrics).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })

    it('should handle API errors gracefully', async () => {
      // Arrange: Setup documents
      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-uuid',
            type: 'core/planning-item',
            uri: 'core://planning/parent-uuid',
            title: 'Test Planning'
          }),
          includedDocuments: [
            { uuid: 'uuid-1' }
          ]
        }
      ]

      // Mock API error
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockGetMetrics.mockRejectedValue(new Error('API Error'))

      // Act
      const decorator = createMetricsDecorator({
        repository: mockRepository
      })

      const result = await decorator.onInitialData!(documents)

      // Assert: Should return empty Map on error
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '📊 Metrics decorator: failed to fetch batch metrics:',
        expect.any(Error)
      )

      consoleWarnSpy.mockRestore()
    })

    it('should return empty Map when no access token', async () => {
      // Arrange: Mock no session
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(nextAuth.getSession).mockResolvedValue(null)

      const documents: DocumentStateWithIncludes[] = [
        {
          document: Document.create({
            uuid: 'parent-uuid',
            type: 'core/planning-item',
            uri: 'core://planning/parent-uuid',
            title: 'Test Planning'
          }),
          includedDocuments: [
            { uuid: 'uuid-1' }
          ]
        }
      ]

      // Act
      const decorator = createMetricsDecorator({
        repository: mockRepository
      })

      const result = await decorator.onInitialData!(documents)

      // Assert
      expect(mockGetMetrics).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '📊 Metrics decorator: No access token available'
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('onUpdate', () => {
    describe('regular document update', () => {
      it('should return undefined for non-inclusion updates', async () => {
        // Arrange: Regular (non-inclusion) document update
        const parentUuid = 'parent-uuid'

        const documentUpdate: DocumentUpdate = {
          setName: 'test-set',
          event: undefined,
          meta: {
            updaterUri: 'test-user',
            modified: new Date().toISOString()
          } as unknown as DocumentMeta,
          document: Document.create({
            uuid: parentUuid,
            type: 'core/planning-item',
            uri: `core://planning/${parentUuid}`,
            title: 'Test Planning'
          }),
          included: false
        }

        // Act
        const decorator = createMetricsDecorator({
          kinds: ['char_count', 'word_count'],
          repository: mockRepository
        })

        const result = await decorator.onUpdate!(documentUpdate)

        // Assert
        expect(mockGetMetrics).not.toHaveBeenCalled()
        expect(result).toBeUndefined()
      })

      it('should return undefined when no document', async () => {
        // Arrange: Inclusion update without document
        const documentUpdate: DocumentUpdate = {
          setName: 'test-set',
          event: undefined,
          meta: {
            updaterUri: 'test-user',
            modified: new Date().toISOString()
          } as unknown as DocumentMeta,
          document: undefined,
          included: true
        }

        // Act
        const decorator = createMetricsDecorator({
          repository: mockRepository
        })

        const result = await decorator.onUpdate!(documentUpdate)

        // Assert
        expect(mockGetMetrics).not.toHaveBeenCalled()
        expect(result).toBeInstanceOf(Map)
        expect((result as Map<string, unknown>).size).toBe(0)
      })
    })

    describe('includedDocument update', () => {
      it('should fetch metrics for single updated included document', async () => {
        // Arrange: Inclusion update for a single document
        const testUuid = 'included-uuid-1'

        const includedDocumentUpdate: DocumentUpdate = {
          setName: 'test-set',
          event: undefined,
          meta: {
            updaterUri: 'test-user',
            modified: new Date().toISOString()
          } as unknown as DocumentMeta,
          document: Document.create({
            uuid: testUuid,
            type: 'core/article',
            uri: `core://article/${testUuid}`,
            title: 'Test Article'
          }),
          included: true
        }

        // Setup mock response
        const mockMetricsResponse = {
          documents: {
            [testUuid]: {
              metrics: [
                { kind: 'char_count', value: '2000' },
                { kind: 'word_count', value: '400' }
              ]
            }
          }
        }

        mockGetMetrics.mockResolvedValue(mockMetricsResponse)

        // Act
        const decorator = createMetricsDecorator({
          kinds: ['char_count', 'word_count'],
          repository: mockRepository
        })

        const result = await decorator.onUpdate?.(includedDocumentUpdate)

        // Assert
        expect(mockGetMetrics).toHaveBeenCalledWith(
          [testUuid],
          ['char_count', 'word_count'],
          'test-access-token'
        )

        expect(result).toBeInstanceOf(Map)
        expect((result as Map<string, MetricsData>).size).toBe(1)
        expect((result as Map<string, MetricsData>).get(testUuid)).toEqual({
          charCount: 2000,
          wordCount: 400
        })
      })

      it('should return empty map when inclusion update has no document uuid', async () => {
        // Arrange: Inclusion update without document.uuid
        const includedDocumentUpdate: DocumentUpdate = {
          setName: 'test-set',
          event: undefined,
          meta: {
            updaterUri: 'test-user',
            modified: new Date().toISOString()
          } as unknown as DocumentMeta,
          document: Document.create({
            uuid: '',
            type: 'core/article',
            uri: 'core://article/',
            title: 'Test Article'
          }),
          included: true
        }

        // Act
        const decorator = createMetricsDecorator({
          repository: mockRepository
        })

        const result = await decorator.onUpdate!(includedDocumentUpdate)

        // Assert
        expect(mockGetMetrics).not.toHaveBeenCalled()
        expect(result).toBeInstanceOf(Map)
        expect((result as Map<string, unknown>).size).toBe(0)
      })

      it('should return empty map when inclusion update has no document uuid', async () => {
        // Arrange: Inclusion update without UUID
        const includedDocumentUpdate: DocumentUpdate = {
          setName: 'test-set',
          event: undefined,
          meta: {
            updaterUri: 'test-user',
            modified: new Date().toISOString()
          } as unknown as DocumentMeta,
          document: undefined,
          included: true
        }

        // Act
        const decorator = createMetricsDecorator({
          repository: mockRepository
        })

        const result = await decorator.onUpdate!(includedDocumentUpdate)

        // Assert
        expect(mockGetMetrics).not.toHaveBeenCalled()
        expect(result).toBeInstanceOf(Map)
        expect((result as Map<string, unknown>).size).toBe(0)
      })
    })
  })
})
