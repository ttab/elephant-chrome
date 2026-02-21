import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Dispatch, SetStateAction } from 'react'
import { Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentRemoved, InclusionBatch, DocumentUpdate, DocumentState } from '@ttab/elephant-api/repositorysocket'
import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import {
  findDeliverableParentIndex,
  upsertIncludedDocument,
  isDocumentRemoved,
  isInclusionBatch,
  isDocumentUpdate,
  isInclusionUpdate,
  handleRemoved,
  handleInclusionBatchUpdate,
  handleDocumentUpdate,
  ScheduleDecoratorUpdate
} from '@/hooks/useRepositorySocket/lib/handlers'
import type { DocumentMeta } from '@ttab/elephant-api/repository'

describe('handlers', () => {
  describe('findDeliverableParentIndex', () => {
    it('should return -1 when targetUuid is undefined', () => {
      const documents: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1'
          })
        }
      ]

      const result = findDeliverableParentIndex(documents)

      expect(result).toBe(-1)
    })

    it('should find parent with matching deliverable link', () => {
      const deliverableUuid = 'deliverable-1'
      const documents: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1',
            meta: [
              {
                type: 'core/assignment',
                links: [
                  {
                    rel: 'deliverable',
                    uuid: deliverableUuid
                  }
                ]
              }
            ]
          })
        }
      ]

      const result = findDeliverableParentIndex(documents, deliverableUuid)

      expect(result).toBe(0)
    })

    it('should return -1 when deliverable not found', () => {
      const documents: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1',
            meta: [
              {
                type: 'core/assignment',
                links: [
                  {
                    rel: 'deliverable',
                    uuid: 'other-deliverable'
                  }
                ]
              }
            ]
          })
        }
      ]

      const result = findDeliverableParentIndex(documents, 'missing-uuid')

      expect(result).toBe(-1)
    })

    it('should skip documents without core/assignment meta', () => {
      const documents: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1',
            meta: [
              {
                type: 'other/type',
                links: []
              }
            ]
          })
        }
      ]

      const result = findDeliverableParentIndex(documents, 'deliverable-1')

      expect(result).toBe(-1)
    })
  })

  describe('upsertIncludedDocument', () => {
    it('should add included document when none exist', () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'parent-1',
          type: 'core/planning-item',
          uri: 'core://planning/parent-1'
        })
      }

      const includedDoc = {
        uuid: 'included-1'
      }

      upsertIncludedDocument(parent, includedDoc)

      expect(parent.includedDocuments).toHaveLength(1)
      expect(parent.includedDocuments?.[0].uuid).toBe('included-1')
    })

    it('should update existing included document', () => {
      const existingState = {
        document: Document.create({
          uuid: 'included-1',
          type: 'core/article',
          uri: 'core://article/included-1',
          title: 'Original Title'
        })
      }

      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'parent-1',
          type: 'core/planning-item',
          uri: 'core://planning/parent-1'
        }),
        includedDocuments: [
          {
            uuid: 'included-1',
            state: existingState
          }
        ]
      }

      const updatedState = {
        document: Document.create({
          uuid: 'included-1',
          type: 'core/article',
          uri: 'core://article/included-1',
          title: 'Updated Title'
        })
      }

      upsertIncludedDocument(parent, { uuid: 'included-1', state: updatedState })

      expect(parent.includedDocuments).toHaveLength(1)
      expect(parent.includedDocuments?.[0].state?.document?.title).toBe('Updated Title')
    })

    it('should set __updater from state metadata', () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'parent-1',
          type: 'core/planning-item',
          uri: 'core://planning/parent-1'
        })
      }

      const state = {
        document: Document.create({
          uuid: 'included-1',
          type: 'core/article',
          uri: 'core://article/included-1'
        }),
        meta: {
          updaterUri: 'user-123',
          modified: '2026-02-09T10:00:00Z'
        }
      } as unknown as DocumentState

      upsertIncludedDocument(parent, { uuid: 'included-1', state })

      expect((parent.includedDocuments?.[0])?.__updater).toEqual({
        sub: 'user-123',
        time: '2026-02-09T10:00:00Z'
      })
    })

    it('should use fallback values when metadata missing', () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'parent-1',
          type: 'core/planning-item',
          uri: 'core://planning/parent-1'
        })
      }

      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-09T10:00:00Z'))

      upsertIncludedDocument(parent, { uuid: 'included-1' })

      expect((parent.includedDocuments?.[0])?.__updater?.sub).toBe('??')
      expect((parent.includedDocuments?.[0])?.__updater?.time).toBeDefined()

      vi.useRealTimers()
    })
  })

  describe('Type guards', () => {
    describe('isDocumentRemoved', () => {
      it('should return true for DocumentRemoved', () => {
        const removed: DocumentRemoved = {
          setName: 'test',
          documentUuid: 'doc-1'
        }

        expect(isDocumentRemoved(removed)).toBe(true)
      })

      it('should return false for DocumentUpdate', () => {
        const update: DocumentUpdate = {
          setName: 'test',
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          }),
          included: false
        }

        expect(isDocumentRemoved(update)).toBe(false)
      })

      it('should return false for InclusionBatch', () => {
        const batch: InclusionBatch = {
          setName: 'test',
          documents: []
        }

        expect(isDocumentRemoved(batch)).toBe(false)
      })
    })

    describe('isInclusionBatch', () => {
      it('should return true for InclusionBatch', () => {
        const batch: InclusionBatch = {
          setName: 'test',
          documents: []
        }

        expect(isInclusionBatch(batch)).toBe(true)
      })

      it('should return false for DocumentUpdate', () => {
        const update: DocumentUpdate = {
          setName: 'test',
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          }),
          included: false
        }

        expect(isInclusionBatch(update)).toBe(false)
      })

      it('should return false for DocumentRemoved', () => {
        const removed: DocumentRemoved = {
          setName: 'test',
          documentUuid: 'doc-1'
        }

        expect(isInclusionBatch(removed)).toBe(false)
      })
    })

    describe('isDocumentUpdate', () => {
      it('should return true for DocumentUpdate with document', () => {
        const update: DocumentUpdate = {
          setName: 'test',
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          }),
          included: false
        }

        expect(isDocumentUpdate(update)).toBe(true)
      })

      it('should return true for DocumentUpdate with included', () => {
        const update: DocumentUpdate = {
          setName: 'test',
          included: true
        }

        expect(isDocumentUpdate(update)).toBe(true)
      })

      it('should return false for DocumentRemoved', () => {
        const removed: DocumentRemoved = {
          setName: 'test',
          documentUuid: 'doc-1'
        }

        expect(isDocumentUpdate(removed)).toBe(false)
      })

      it('should return false for InclusionBatch', () => {
        const batch: InclusionBatch = {
          setName: 'test',
          documents: []
        }

        expect(isDocumentUpdate(batch)).toBe(false)
      })
    })

    describe('isInclusionUpdate', () => {
      it('should return true for DocumentUpdate with included=true', () => {
        const update: DocumentUpdate = {
          setName: 'test',
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          }),
          included: true
        }

        expect(isInclusionUpdate(update)).toBe(true)
      })

      it('should return false for DocumentUpdate with included=false', () => {
        const update: DocumentUpdate = {
          setName: 'test',
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          }),
          included: false
        }

        expect(isInclusionUpdate(update)).toBe(false)
      })

      it('should return false for DocumentRemoved', () => {
        const removed: DocumentRemoved = {
          setName: 'test',
          documentUuid: 'doc-1'
        }

        expect(isInclusionUpdate(removed)).toBe(false)
      })

      it('should return false for InclusionBatch', () => {
        const batch: InclusionBatch = {
          setName: 'test',
          documents: []
        }

        expect(isInclusionUpdate(batch)).toBe(false)
      })
    })
  })

  describe('handleRemoved', () => {
    it('should remove document matching uuid', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          })
        },
        {
          document: Document.create({
            uuid: 'doc-2',
            type: 'core/article',
            uri: 'core://article/doc-2'
          })
        }
      ]

      const removed: DocumentRemoved = {
        setName: 'test-set',
        documentUuid: 'doc-1'
      }

      const result = handleRemoved(prevData, removed)

      expect(result).toHaveLength(1)
      expect(result[0].document?.uuid).toBe('doc-2')
    })

    it('should return same array if no match', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          })
        }
      ]

      const removed: DocumentRemoved = {
        setName: 'test',
        documentUuid: 'missing-uuid'
      }

      const result = handleRemoved(prevData, removed)

      expect(result).toHaveLength(1)
      expect(result[0].document?.uuid).toBe('doc-1')
    })
  })

  describe('handleInclusionBatchUpdate', () => {
    it('should update included documents for matching parent', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1',
            meta: [
              {
                type: 'core/assignment',
                links: [
                  {
                    rel: 'deliverable',
                    uuid: 'included-1'
                  }
                ]
              }
            ]
          })
        }
      ]

      const batch: InclusionBatch = {
        setName: 'test',
        documents: [
          {
            uuid: 'included-1',
            state: {
              document: Document.create({
                uuid: 'included-1',
                type: 'core/article',
                uri: 'core://article/included-1'
              })
            }
          }
        ]
      }

      const result = handleInclusionBatchUpdate(prevData, batch)

      expect(result).not.toBe(prevData)
      expect(result[0].includedDocuments).toHaveLength(1)
    })

    it('should return same data if no parent found', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1'
          })
        }
      ]

      const batch: InclusionBatch = {
        setName: 'test',
        documents: [
          {
            uuid: 'orphan-1',
            state: {
              document: Document.create({
                uuid: 'orphan-1',
                type: 'core/article',
                uri: 'core://article/orphan-1'
              })
            }
          }
        ]
      }

      const result = handleInclusionBatchUpdate(prevData, batch)

      expect(result).toBe(prevData)
    })

    it('should handle empty batch', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1'
          })
        }
      ]

      const batch: InclusionBatch = {
        setName: 'test-set',
        // @ts-expect-error testing undefined case
        documents: undefined
      }

      const result = handleInclusionBatchUpdate(prevData, batch)

      expect(result).toBe(prevData)
    })
  })

  describe('handleDocumentUpdate', () => {
    const createMockScheduleDecoratorUpdate = () => new ScheduleDecoratorUpdate(
      vi.fn(),
      { current: [] },
      { current: 'test-token' },
      vi.fn()
    )

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should update existing document', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          })
        }
      ]

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Updated Title'
        }),
        meta: {
          updaterUri: 'user-123',
          modified: '2026-02-09T10:00:00Z'
        } as unknown as DocumentMeta,
        included: false
      }

      const mockExecute = vi.fn()
      const scheduler = new ScheduleDecoratorUpdate(
        vi.fn(),
        { current: [] },
        { current: 'test-token' },
        vi.fn()
      )
      scheduler.execute = mockExecute

      const result = handleDocumentUpdate(prevData, update, scheduler)

      expect(result).not.toBe(prevData)
      expect(result[0].document?.title).toBe('Updated Title')
      expect(result[0].__updater).toEqual({
        sub: 'user-123',
        time: '2026-02-09T10:00:00Z'
      })
      expect(mockExecute).toHaveBeenCalled()
    })

    it('should add new document with metadata', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          })
        }
      ]

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-2',
          type: 'core/article',
          uri: 'core://article/doc-2'
        }),
        meta: {
          updaterUri: 'user-456',
          modified: '2026-02-09T11:00:00Z'
        } as unknown as DocumentMeta,
        included: false
      }

      const result = handleDocumentUpdate(prevData, update, createMockScheduleDecoratorUpdate())

      expect(result).toHaveLength(2)
      expect(result[0].document?.uuid).toBe('doc-2')
      expect(result[0].__updater?.sub).toBe('user-456')
    })

    it('should not add new document without metadata', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/article',
            uri: 'core://article/doc-1'
          })
        }
      ]

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-2',
          type: 'core/article',
          uri: 'core://article/doc-2'
        }),
        included: false
      }

      const result = handleDocumentUpdate(prevData, update, createMockScheduleDecoratorUpdate())

      expect(result).toBe(prevData)
    })

    it('should update included document in parent', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1',
            meta: [
              {
                type: 'core/assignment',
                links: [
                  {
                    rel: 'deliverable',
                    uuid: 'included-1'
                  }
                ]
              }
            ]
          })
        }
      ]

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'included-1',
          type: 'core/article',
          uri: 'core://article/included-1'
        }),
        included: true
      }

      const result = handleDocumentUpdate(prevData, update, createMockScheduleDecoratorUpdate())

      expect(result).not.toBe(prevData)
      expect(result[0].includedDocuments).toHaveLength(1)
      expect(result[0].includedDocuments?.[0].uuid).toBe('included-1')
    })

    it('should not update if included document has no parent', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'parent-1',
            type: 'core/planning-item',
            uri: 'core://planning/parent-1'
          })
        }
      ]

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'orphan-1',
          type: 'core/article',
          uri: 'core://article/orphan-1'
        }),
        included: true
      }

      const result = handleDocumentUpdate(prevData, update, createMockScheduleDecoratorUpdate())

      expect(result).toBe(prevData)
    })

    it('should preserve existing included documents on main update', () => {
      const prevData: DocumentStateWithDecorators[] = [
        {
          document: Document.create({
            uuid: 'doc-1',
            type: 'core/planning-item',
            uri: 'core://planning/doc-1'
          }),
          includedDocuments: [
            {
              uuid: 'included-1',
              state: {
                document: Document.create({
                  uuid: 'included-1',
                  type: 'core/article',
                  uri: 'core://article/included-1'
                })
              }
            }
          ]
        }
      ]

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/planning-item',
          uri: 'core://planning/doc-1',
          title: 'Updated'
        }),
        meta: {
          updaterUri: 'user-123',
          modified: '2026-02-09T10:00:00Z'
        } as unknown as DocumentMeta,
        included: false
      }

      const result = handleDocumentUpdate(prevData, update, createMockScheduleDecoratorUpdate())

      expect(result[0].includedDocuments).toHaveLength(1)
      expect(result[0].includedDocuments?.[0].uuid).toBe('included-1')
    })
  })

  describe('ScheduleDecoratorUpdate', () => {
    /**
     * Creates a setData mock that invokes functional updaters with the current state,
     * mimicking React's setState behavior. Uses a lazy getter so the state can reference
     * variables defined after setData (e.g. parent).
     */
    const createStatefulSetData = (getState: () => DocumentStateWithDecorators[]) => {
      return vi.fn((action: SetStateAction<DocumentStateWithDecorators[]>) => {
        if (typeof action === 'function') {
          action(getState())
        }
      }) as unknown as Dispatch<SetStateAction<DocumentStateWithDecorators[]>>
    }

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should not execute if uuid missing', async () => {
      const setData = vi.fn()
      const decoratorsRef = { current: [] }
      const runUpdateDecorators = vi.fn()

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators)

      const update: DocumentUpdate = {
        setName: 'test-set',
        included: false
      }

      scheduler.execute(update)
      await vi.advanceTimersByTimeAsync(300)

      expect(runUpdateDecorators).not.toHaveBeenCalled()
      expect(setData).not.toHaveBeenCalled()
    })

    it('should not execute if parent is null', async () => {
      const setData = vi.fn()
      const decoratorsRef = { current: [] }
      const runUpdateDecorators = vi.fn()

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators)

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        }),
        included: false
      }

      scheduler.execute(update, null)
      await vi.advanceTimersByTimeAsync(300)

      expect(runUpdateDecorators).not.toHaveBeenCalled()
      expect(setData).not.toHaveBeenCalled()
    })

    it('should call runUpdateDecorators and update state after debounce', async () => {
      const enrichedDoc: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Enriched'
        }),
        decoratorData: { someKey: 'someValue' }
      }

      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        })
      }

      const setData = createStatefulSetData(() => [parent])
      const decoratorsRef = { current: [] }
      const runUpdateDecorators = vi.fn().mockResolvedValue(enrichedDoc)

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators)

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        }),
        included: false
      }

      scheduler.execute(update, parent)
      await vi.advanceTimersByTimeAsync(300)

      expect(runUpdateDecorators).toHaveBeenCalledWith(parent, update, [], 'test-token')
      // Called twice: once to read current state, once to write enriched result
      expect(setData).toHaveBeenCalledTimes(2)
    })

    it('should handle decorator errors gracefully', async () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        })
      }

      const setData = createStatefulSetData(() => [parent])
      const decoratorsRef = { current: [] }
      const runUpdateDecorators = vi.fn().mockRejectedValue(new Error('Decorator error'))
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators)

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        }),
        included: false
      }

      scheduler.execute(update, parent)
      await vi.advanceTimersByTimeAsync(300)

      expect(consoleWarnSpy).toHaveBeenCalledWith('Update decorator failed:', expect.any(Error))
      // Only the state read call — no write since decorator threw
      expect(setData).toHaveBeenCalledTimes(1)

      consoleWarnSpy.mockRestore()
    })

    it('should discard stale result when newer call supersedes', async () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        })
      }

      const setData = createStatefulSetData(() => [parent])
      const decoratorsRef = { current: [] }

      const staleResult: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Stale'
        })
      }

      const freshResult: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Fresh'
        })
      }

      // First call resolves slowly (after 200ms), second resolves quickly (after 50ms)
      let resolveFirst: (value: DocumentStateWithDecorators) => void
      const firstPromise = new Promise<DocumentStateWithDecorators>((resolve) => {
        resolveFirst = resolve
      })

      let resolveSecond: (value: DocumentStateWithDecorators) => void
      const secondPromise = new Promise<DocumentStateWithDecorators>((resolve) => {
        resolveSecond = resolve
      })

      const runUpdateDecorators = vi.fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)

      // Use 0 debounce to test the sequence counter independently
      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators, 0)

      const update1: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        }),
        included: false
      }

      const update2: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        }),
        included: false
      }

      // Fire first call, flush its debounce
      scheduler.execute(update1, parent)
      await vi.advanceTimersByTimeAsync(0)

      // Fire second call, flush its debounce
      scheduler.execute(update2, parent)
      await vi.advanceTimersByTimeAsync(0)

      // Resolve second (fresh) first
      resolveSecond!(freshResult)
      await vi.advanceTimersByTimeAsync(0)

      // 2 reads (one per #run) + 1 write (fresh result)
      expect(setData).toHaveBeenCalledTimes(3)

      // Resolve first (stale) after
      resolveFirst!(staleResult)
      await vi.advanceTimersByTimeAsync(0)

      // Still 3 — stale result discarded by sequence check, no additional write
      expect(setData).toHaveBeenCalledTimes(3)
    })

    it('should discard in-flight result when execute called during async run', async () => {
      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        })
      }

      const setData = createStatefulSetData(() => [parent])
      const decoratorsRef = { current: [] }

      const staleResult: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Stale'
        })
      }

      const freshResult: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Fresh'
        })
      }

      let resolveFirst: (value: DocumentStateWithDecorators) => void
      const firstPromise = new Promise<DocumentStateWithDecorators>((resolve) => {
        resolveFirst = resolve
      })

      const runUpdateDecorators = vi.fn()
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce(freshResult)

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators, 100)

      const makeUpdate = (title: string): DocumentUpdate => ({
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title
        }),
        included: false
      })

      // First execute, flush debounce so #run starts (and awaits firstPromise)
      scheduler.execute(makeUpdate('First'), parent)
      await vi.advanceTimersByTimeAsync(100)
      expect(runUpdateDecorators).toHaveBeenCalledTimes(1)

      // Second execute while #run is still in-flight — bumps sequence immediately
      scheduler.execute(makeUpdate('Second'), parent)

      // Resolve the first (stale) run — should be discarded because sequence was bumped
      resolveFirst!(staleResult)
      await vi.advanceTimersByTimeAsync(0)
      // 1 read call from first #run, but no write (stale result discarded)
      expect(setData).toHaveBeenCalledTimes(1)

      // Flush second debounce so second #run fires and completes
      await vi.advanceTimersByTimeAsync(100)

      expect(runUpdateDecorators).toHaveBeenCalledTimes(2)
      // 2 reads (one per #run) + 1 write (fresh result)
      expect(setData).toHaveBeenCalledTimes(3)
    })

    it('should debounce rapid calls and only run once with last update', async () => {
      const enrichedDoc: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title: 'Final'
        })
      }

      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        })
      }

      const setData = createStatefulSetData(() => [parent])
      const decoratorsRef = { current: [] }
      const runUpdateDecorators = vi.fn().mockResolvedValue(enrichedDoc)

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators)

      const makeUpdate = (title: string): DocumentUpdate => ({
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1',
          title
        }),
        included: false
      })

      const update3 = makeUpdate('Third')

      // Fire 3 rapid calls
      scheduler.execute(makeUpdate('First'), parent)
      scheduler.execute(makeUpdate('Second'), parent)
      scheduler.execute(update3, parent)

      // Flush debounce
      await vi.advanceTimersByTimeAsync(300)

      expect(runUpdateDecorators).toHaveBeenCalledTimes(1)
      expect(runUpdateDecorators).toHaveBeenCalledWith(parent, update3, [], 'test-token')
    })

    it('should cancel pending timers on cleanup', async () => {
      const setData = vi.fn()
      const decoratorsRef = { current: [] }
      const runUpdateDecorators = vi.fn()

      const scheduler = new ScheduleDecoratorUpdate(setData, decoratorsRef, { current: 'test-token' }, runUpdateDecorators)

      const parent: DocumentStateWithDecorators = {
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        })
      }

      const update: DocumentUpdate = {
        setName: 'test-set',
        document: Document.create({
          uuid: 'doc-1',
          type: 'core/article',
          uri: 'core://article/doc-1'
        }),
        included: false
      }

      scheduler.execute(update, parent)
      scheduler.cleanup()

      await vi.advanceTimersByTimeAsync(300)

      expect(runUpdateDecorators).not.toHaveBeenCalled()
    })
  })
})
