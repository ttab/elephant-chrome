import { renderHook } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Planning } from '@/shared/schemas/planning'

import { useInitFilters } from '@/hooks/useInitFilters'
import type { QueryParams } from '@/hooks/useQuery'
import { useQuery } from '@/hooks/useQuery'
import { useUserTracker } from '@/hooks/useUserTracker'

// Get typed mock functions
const mockUseQuery = vi.mocked(useQuery)
const mockUseUserTracker = vi.mocked(useUserTracker)

vi.mock('@/hooks/useQuery', () => ({
  useQuery: vi.fn()
}))

vi.mock('@/hooks/useUserTracker', () => ({
  useUserTracker: vi.fn()
}))

describe('useInitFilters', () => {
  const mockSetQuery = vi.fn()

  beforeEach(() => {
    // needed to reset previous use of useQuery otherwise it can not be mocked
    vi.hoisted(() => {
      vi.resetModules()
    })
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('returns empty array when no filters exist', () => {
      mockUseQuery.mockReturnValue([{}, mockSetQuery])
      mockUseUserTracker.mockReturnValue([undefined, vi.fn(), true])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([])
    })

    it('returns empty array when filters are empty objects', () => {
      mockUseQuery.mockReturnValue([{}, mockSetQuery])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([])
    })

    it('returns empty array when filters contain only undefined/empty values', () => {
      mockUseQuery.mockReturnValue([{ section: undefined, query: '' }, mockSetQuery])
      mockUseUserTracker.mockReturnValue([{ section: undefined }, vi.fn(), true])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([])
    })
  })

  describe('query filters (priority)', () => {
    it('returns column filters from query when available', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query', section: 'section-from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([
        { section: 'section-from-user', status: 'status-from-user' },
        vi.fn(),
        true
      ])

      const columns: ColumnDef<Planning>[] = [
        { id: 'section' },
        { id: 'status' }
      ]

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current', columns })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-query'] },
        { id: 'section', value: ['section-from-query'] }
      ])
    })

    it('prioritizes query over user filters when both exist', () => {
      mockUseQuery.mockReturnValue([
        { status: 'from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([
        { status: 'from-user' },
        vi.fn(),
        true
      ])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['from-query'] }
      ])
    })

    it('converts single values to arrays for query filters', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query', section: ['section-from-query-1', 'section-from-query-2'] },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-query'] },
        { id: 'section', value: ['section-from-query-1', 'section-from-query-2'] }
      ])
    })
  })

  describe('user filters (fallback)', () => {
    it('returns user filters when query is empty', () => {
      mockUseQuery.mockReturnValue([{}, mockSetQuery])
      mockUseUserTracker.mockReturnValue([
        { status: 'status-from-user', section: 'section-from-user' },
        vi.fn(),
        true
      ])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-user'] },
        { id: 'section', value: ['section-from-user'] }
      ])
    })

    it('converts single values to arrays for user filters', () => {
      mockUseQuery.mockReturnValue([{}, mockSetQuery])
      mockUseUserTracker.mockReturnValue([
        { status: 'status-from-user', section: ['section-from-user-1', 'section-from-user-2'] },
        vi.fn(),
        true
      ])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-user'] },
        { id: 'section', value: ['section-from-user-1', 'section-from-user-2'] }
      ])
    })
  })

  describe('column filtering', () => {
    it('filters by column IDs when columns are provided', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query', section: 'section-from-query', irrelevant: 'irrelevant-from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const columns: ColumnDef<Planning>[] = [
        { id: 'status' },
        { id: 'section' }
      ]

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current', columns })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-query'] },
        { id: 'section', value: ['section-from-query'] }
      ])

      // Should not include 'irrelevant' field
      expect(result.current.find((f) => f.id === 'irrelevant')).toBeUndefined()
    })

    it('includes all filters when no columns are provided', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query', section: 'section-from-query', category: 'category-from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-query'] },
        { id: 'section', value: ['section-from-query'] },
        { id: 'category', value: ['category-from-query'] }
      ])
    })

    it('handles columns without id property', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query', section: 'section-from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const columns: ColumnDef<Planning>[] = [
        { id: 'status' },
        { } as ColumnDef<Planning>,
        { id: 'section' }
      ]

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current', columns })
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-query'] },
        { id: 'section', value: ['section-from-query'] }
      ])
    })

    it('handles empty columns array', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current', columns: [] })
      )

      expect(result.current).toEqual([])
    })
  })

  describe('query initialization from user filters', () => {
    it('initializes query from user filters when query is empty', () => {
      let queryState = {}
      const mockSetQueryFn = vi.fn((newQuery: QueryParams) => {
        queryState = newQuery
      })

      mockUseQuery.mockReturnValue([queryState, mockSetQueryFn])
      mockUseUserTracker.mockReturnValue([
        { status: 'status-from-user' },
        vi.fn(),
        true
      ])

      renderHook(() =>
        useInitFilters({ path: 'filters.Planning' })
      )

      expect(mockSetQueryFn).toHaveBeenCalledWith({ status: 'status-from-user' })
    })

    it('does not initialize query when query already has filters', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-from-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([
        { status: 'status-from-user' },
        vi.fn(),
        true
      ])

      const { result } = renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(mockSetQuery).not.toHaveBeenCalled()
      expect(result.current).toEqual([
        { id: 'status', value: ['status-from-query'] }
      ])
    })

    it('does not initialize query when user filters are empty', () => {
      mockUseQuery.mockReturnValue([{}, mockSetQuery])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      renderHook(() =>
        useInitFilters({ path: 'filters.Planning.current' })
      )

      expect(mockSetQuery).not.toHaveBeenCalled()
    })

    it('initializes query only once', () => {
      mockUseQuery.mockReturnValue([{}, mockSetQuery])
      mockUseUserTracker.mockReturnValue([
        { status: 'pending' },
        vi.fn(),
        true
      ])

      const { rerender } = renderHook(() =>
        useInitFilters({ path: 'filtes.Planning.current' })
      )

      // First render should initialize
      expect(mockSetQuery).toHaveBeenCalledTimes(1)

      // Rerender should not initialize again
      rerender()
      expect(mockSetQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('reactivity and updates', () => {
    it('updates when columns change', () => {
      mockUseQuery.mockReturnValue([
        { status: 'status-query', section: 'section-query', category: 'category-query' },
        mockSetQuery
      ])
      mockUseUserTracker.mockReturnValue([{}, vi.fn(), true])

      const { result, rerender } = renderHook(
        ({ columns }) => useInitFilters({ path: 'filters.Planning.current', columns }),
        {
          initialProps: {
            columns: [
              { id: 'status' }
            ] as ColumnDef<Planning>[]
          }
        }
      )

      expect(result.current).toEqual([
        { id: 'status', value: ['status-query'] }
      ])

      rerender({
        columns: [
          { id: 'status' },
          { id: 'section' }
        ] as ColumnDef<Planning>[]
      })

      expect(result.current).toEqual([
        { id: 'status', value: ['status-query'] },
        { id: 'section', value: ['section-query'] }
      ])
    })
  })
})
