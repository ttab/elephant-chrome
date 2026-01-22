import { renderHook, waitFor } from '@testing-library/react'
import { useYDocument } from '@/modules/yjs/hooks'
import { act } from '../setupTests'
import * as Y from 'yjs'
import type { EleDocumentResponse } from '@/shared/types'
import createHash from '@/shared/createHash'
import { setValueByYPath, toYStructure } from '@/shared/yUtils'

const mockDocumentData: EleDocumentResponse = {
  isMetaDocument: false,
  mainDocument: '',
  document: {
    uuid: 'test-uuid',
    type: 'core/article',
    uri: 'test://article',
    url: 'https://test.com/article',
    title: 'Test Article',
    content: [
      {
        id: 'aca8cb11-ee65-493e-b646-848f474d2e6b',
        type: 'core/text',
        properties: {},
        class: 'text',
        children: [
          {
            text: 'This is a sample paragraph for testing.'
          }
        ]
      }
    ],
    meta: {},
    links: {},
    language: 'sv'
  },
  version: '1'
}

const createMockDocumentData = (): EleDocumentResponse =>
  JSON.parse(JSON.stringify(mockDocumentData)) as EleDocumentResponse

describe('useYDocument', () => {
  describe('Basic functionality', () => {
    it('returns basic document properties and reacts to ctx changes', () => {
      const { result } = renderHook(() => useYDocument('doc-1'))

      expect(result.current.id).toBe('doc-1')
      expect(result.current.visibility).toBe(true)

      // user should be set when visibility is true
      expect(result.current.user).not.toBeNull()
      expect(result.current.user?.name).toBe('Testy Test')
      expect(result.current.user?.initials).toBe('TT')

      // provider/client not available in this environment
      expect(result.current.provider).toBeNull()
      expect(result.current.send('x', {})).toBeUndefined()

      // initial isChanged should be false
      expect(result.current.isChanged).toBe(false)

      // Mutate the underlying ctx map and ensure the hook updates
      act(() => {
        result.current.ctx.set('isChanged', true)
      })

      expect(result.current.isChanged).toBe(true)

      // transact should allow setting values on the document's 'document' map
      act(() => {
        result.current.transact((map) => {
          map.set('k1', 'v1')
        })
      })

      const doc = result.current.ctx.doc
      expect(doc?.getMap('document').get('k1')).toBe('v1')

      // setIsChanged setter should update local state
      act(() => {
        result.current.setIsChanged(false)
      })
      expect(result.current.isChanged).toBe(false)
    })

    it('creates YDoc with default "ele" root map', () => {
      const { result } = renderHook(() => useYDocument('doc-default'))

      expect(result.current.ele).toBeDefined()
      expect(result.current.ele).toBeInstanceOf(Y.Map)
      expect(result.current.ctx).toBeInstanceOf(Y.Map)
    })

    it('supports custom rootMap option', () => {
      const { result } = renderHook(() =>
        useYDocument('doc-custom-root', { rootMap: 'customRoot' })
      )

      expect(result.current.ele).toBeDefined()
      // The ele property points to the custom root map
      const doc = result.current.ctx.doc
      expect(doc?.getMap('customRoot')).toBe(result.current.ele)
    })
  })

  describe('Visibility and user awareness', () => {
    it('respects visibility=false and does not expose user', () => {
      const { result } = renderHook(() => useYDocument('doc-2', { visibility: false }))
      expect(result.current.visibility).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('sets user with correct initials from session name', () => {
      const { result } = renderHook(() => useYDocument('doc-user'))

      expect(result.current.user).not.toBeNull()
      expect(result.current.user?.name).toBe('Testy Test')
      expect(result.current.user?.initials).toBe('TT')
      expect(result.current.user?.color).toBeDefined()
    })

    it('defaults visibility to true when not specified', () => {
      const { result } = renderHook(() => useYDocument('doc-vis-default'))
      expect(result.current.visibility).toBe(true)
    })
  })

  describe('Document initialization', () => {
    it('honors initial isInProgress when data option is provided', () => {
      const { result } = renderHook(() => useYDocument('doc-3', { data: createMockDocumentData() }))
      // When data is provided, createTypedYDoc sets ctx.isInProgress to true
      expect(result.current.isInProgress).toBe(true)

      // And setIsInProgress should be callable
      act(() => {
        result.current.setIsInProgress(false)
      })
      expect(result.current.isInProgress).toBe(false)
    })

    it('initializes with document data when provided', () => {
      const mockData = createMockDocumentData()

      const { result } = renderHook(() =>
        useYDocument('doc-with-data', { data: mockData })
      )

      expect(result.current.isInProgress).toBe(true)
      expect(result.current.ctx.get('version')).toBe('1')
      expect(result.current.ctx.get('hash')).toBeDefined()
    })

    it('initializes isInProgress to false when no data provided', () => {
      const { result } = renderHook(() => useYDocument('doc-no-data'))
      expect(result.current.isInProgress).toBe(false)
    })
  })

  describe('isChanged tracking', () => {
    it('sets isChanged to true when document is modified', async () => {
      const { result } = renderHook(() => useYDocument<Y.Map<unknown>>('doc-changed'))
      expect(result.current.isChanged).toBe(false)

      // Modify the ele map
      act(() => {
        result.current.ele.set('testKey', 'testValue')
      })

      await waitFor(() => {
        expect(result.current.isChanged).toBe(true)
      })
    })

    it('persists isChanged state in ctx map', () => {
      const { result } = renderHook(() => useYDocument('doc-persist'))
      expect(result.current.isChanged).toBe(false)

      act(() => {
        result.current.setIsChanged(true)
      })

      expect(result.current.ctx.get('isChanged')).toBe(true)
      expect(result.current.isChanged).toBe(true)
    })

    it('reacts to ctx.isChanged updates from external sources', () => {
      const { result } = renderHook(() => useYDocument('doc-external'))

      act(() => {
        result.current.ctx.set('isChanged', true)
      })

      expect(result.current.isChanged).toBe(true)
    })

    it('ignores document initialization changes', async () => {
      const mockData = createMockDocumentData()

      const { result } = renderHook(() =>
        useYDocument('doc-init', { data: mockData })
      )

      // Initial document setup shouldn't trigger isChanged
      await waitFor(() => {
        expect(result.current.isInProgress).toBe(true)
      })

      // isChanged should still be false after initialization
      expect(result.current.isChanged).toBe(false)
    })
  })

  describe('Transaction functionality', () => {
    it('performs transactions on document map', () => {
      const { result } = renderHook(() => useYDocument('doc-transaction'))

      act(() => {
        result.current.transact((map, tr) => {
          map.set('key1', 'value1')
          map.set('key2', 'value2')
          expect(tr).toBeDefined()
        })
      })

      const doc = result.current.ctx.doc
      const docMap = doc?.getMap('document')
      expect(docMap?.get('key1')).toBe('value1')
      expect(docMap?.get('key2')).toBe('value2')
    })

    it('batches multiple changes in a single transaction', () => {
      const { result } = renderHook(() => useYDocument('doc-batch'))

      let eventCount = 0
      const doc = result.current.ctx.doc
      const docMap = doc?.getMap('document')

      docMap?.observe(() => {
        eventCount++
      })

      act(() => {
        result.current.transact((map) => {
          map.set('a', 1)
          map.set('b', 2)
          map.set('c', 3)
        })
      })

      // Should fire only one event for the entire transaction
      expect(eventCount).toBe(1)
    })
  })

  describe('Connection states', () => {
    it('initializes with disconnected state', () => {
      const { result } = renderHook(() => useYDocument('doc-connection'))

      expect(result.current.connected).toBe(false)
      expect(result.current.synced).toBe(false)
      expect(result.current.online).toBe(true) // useIsOnline mock returns true
    })

    it('exposes online status from useIsOnline', () => {
      const { result } = renderHook(() => useYDocument('doc-online'))

      // From mocked useIsOnline hook
      expect(result.current.online).toBe(true)
    })
  })

  describe('State setters', () => {
    it('updates isInProgress via setter', () => {
      const { result } = renderHook(() => useYDocument('doc-setter-progress'))

      expect(result.current.isInProgress).toBe(false)

      act(() => {
        result.current.setIsInProgress(true)
      })

      expect(result.current.isInProgress).toBe(true)
      expect(result.current.ctx.get('isInProgress')).toBe(true)
    })

    it('updates isChanged via setter', () => {
      const { result } = renderHook(() => useYDocument('doc-setter-changed'))

      expect(result.current.isChanged).toBe(false)

      act(() => {
        result.current.setIsChanged(true)
      })

      expect(result.current.isChanged).toBe(true)
      expect(result.current.ctx.get('isChanged')).toBe(true)
    })
  })

  describe('Hash tracking', () => {
    it('stores initial hash in ctx when data provided', () => {
      const mockData = createMockDocumentData()

      const { result } = renderHook(() =>
        useYDocument<Y.Map<unknown>>('doc-hash', { data: mockData })
      )

      const storedHash = result.current.ctx.get('hash')
      expect(storedHash).toBeDefined()
      expect(typeof storedHash).toBe('number')
    })

    it('detects changes via hash comparison', async () => {
      const { result } = renderHook(() => useYDocument<Y.Map<unknown>>('doc-hash-change'))

      const initialHash = createHash(result.current.ele)
      result.current.ctx.set('hash', initialHash)

      expect(result.current.isChanged).toBe(false)

      act(() => {
        result.current.ele.set('newField', 'newValue')
      })

      await waitFor(() => {
        expect(result.current.isChanged).toBe(true)
      })
    })

    it('ignores matching ignoreChangeKeys when tracking isChanged', async () => {
      const { result } = renderHook(() =>
        useYDocument<Y.Map<unknown>>('doc-ignore', { ignoreChangeKeys: ['newField'] })
      )

      const initialHash = createHash(result.current.ele)
      result.current.ctx.set('hash', initialHash)

      act(() => {
        result.current.ele.set('newField', 'ignored-value')
      })

      await waitFor(() => {
        expect(result.current.isChanged).toBe(false)
      })
    })

    it('ignores nested wildcard ignoreChangeKeys when tracking isChanged', async () => {
      const { result } = renderHook(() =>
        useYDocument<Y.Map<unknown>>('doc-ignore-nested', {
          ignoreChangeKeys: ['meta.*.title']
        })
      )

      act(() => {
        setValueByYPath(result.current.ele, 'meta.sectionA.title', 'initial-title')
      })

      const initialHash = createHash(result.current.ele)
      act(() => {
        result.current.ctx.set('hash', initialHash)
        result.current.setIsChanged(false)
      })

      act(() => {
        setValueByYPath(result.current.ele, 'meta.sectionA.title', 'ignored-title')
      })

      await waitFor(() => {
        expect(result.current.isChanged).toBe(false)
      })
    })

    it('ignores @internalDescriptionIndex ignoreChangeKeys when tracking isChanged', async () => {
      const { result } = renderHook(() =>
        useYDocument<Y.Map<unknown>>('doc-ignore-internal', {
          ignoreChangeKeys: ['meta.core/description[@internalDescriptionIndex].data.text']
        })
      )

      act(() => {
        setValueByYPath(result.current.ele, 'meta.core/description', toYStructure([{
          role: 'public',
          data: { text: 'public-initial' }
        },
        {
          role: 'internal',
          data: { text: 'internal-initial' }
        }]))
      })

      const initialHash = createHash(result.current.ele)
      act(() => {
        result.current.ctx.set('hash', initialHash)
        result.current.setIsChanged(false)
      })

      act(() => {
        setValueByYPath(result.current.ele, 'meta.core/description[1].data.text', 'internal-updated')
      })

      await waitFor(() => {
        expect(result.current.isChanged).toBe(false)
      })
    })
  })

  describe('Multiple hook instances', () => {
    it('can handle multiple instances with different IDs', () => {
      const { result: result1 } = renderHook(() => useYDocument('doc-multi-1'))
      const { result: result2 } = renderHook(() => useYDocument('doc-multi-2'))

      expect(result1.current.id).toBe('doc-multi-1')
      expect(result2.current.id).toBe('doc-multi-2')
      expect(result1.current.ele).not.toBe(result2.current.ele)
    })

    it('maintains independent state for each instance', () => {
      const { result: result1 } = renderHook(() => useYDocument('doc-independent-1'))
      const { result: result2 } = renderHook(() => useYDocument('doc-independent-2'))

      act(() => {
        result1.current.setIsChanged(true)
      })

      expect(result1.current.isChanged).toBe(true)
      expect(result2.current.isChanged).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('handles empty document ID', () => {
      const { result } = renderHook(() => useYDocument(''))

      expect(result.current.id).toBe('')
      expect(result.current.ele).toBeDefined()
    })

    it('maintains stable reference for result object', () => {
      const { result, rerender } = renderHook(() => useYDocument('doc-stable'))

      const firstRef = result.current

      rerender()

      // Should return the same object reference
      expect(result.current).toBe(firstRef)
    })

    it('sends messages even when provider is null', () => {
      const { result } = renderHook(() => useYDocument('doc-send'))

      // Should not throw when provider is null
      expect(() => {
        result.current.send('test', { data: 'value' })
      }).not.toThrow()
    })
  })
})
