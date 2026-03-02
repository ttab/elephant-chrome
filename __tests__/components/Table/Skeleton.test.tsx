import { render, act } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { TableSkeleton } from '@/components/Table/Skeleton'

const twoColumns = [
  { id: 'col1', meta: { className: 'w-1/2' } },
  { id: 'col2', meta: { className: 'w-1/4' } }
] as unknown as ColumnDef<unknown>[]

describe('TableSkeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('before delay fires', () => {
    it('returns null immediately after mount (not visible)', () => {
      render(<TableSkeleton columns={twoColumns} />)
      expect(document.querySelector('table')).toBeNull()
    })

    it('is still null at delay - 1ms', () => {
      render(<TableSkeleton columns={twoColumns} />)
      void act(() => vi.advanceTimersByTime(299))
      expect(document.querySelector('table')).toBeNull()
    })
  })

  describe('after delay fires', () => {
    it('becomes visible after default 300ms delay', () => {
      render(<TableSkeleton columns={twoColumns} />)
      void act(() => vi.advanceTimersByTime(300))
      expect(document.querySelector('table')).not.toBeNull()
    })

    it('renders one <th> per column in header', () => {
      render(<TableSkeleton columns={twoColumns} />)
      void act(() => vi.advanceTimersByTime(300))
      const headers = document.querySelectorAll('th')
      expect(headers).toHaveLength(twoColumns.length)
    })

    it('renders Math.ceil(window.innerHeight / 40) body rows', () => {
      const expectedRowCount = Math.ceil(window.innerHeight / 40)
      render(<TableSkeleton columns={twoColumns} />)
      void act(() => vi.advanceTimersByTime(300))
      // tbody rows
      const tbodyRows = document.querySelectorAll('tbody tr')
      expect(tbodyRows).toHaveLength(expectedRowCount)
    })

    it('each body row has one cell per column', () => {
      const expectedRowCount = Math.ceil(window.innerHeight / 40)
      render(<TableSkeleton columns={twoColumns} />)
      void act(() => vi.advanceTimersByTime(300))
      const tbodyRows = document.querySelectorAll('tbody tr')
      tbodyRows.forEach((row) => {
        expect(row.querySelectorAll('td')).toHaveLength(twoColumns.length)
      })
      expect(tbodyRows).toHaveLength(expectedRowCount)
    })
  })

  describe('custom delay prop', () => {
    it('respects delay=0 — visible synchronously after mount + act', () => {
      render(<TableSkeleton columns={twoColumns} delay={0} />)
      void act(() => vi.advanceTimersByTime(0))
      expect(document.querySelector('table')).not.toBeNull()
    })

    it('respects delay=1000 — not visible at 999ms, visible at 1000ms', () => {
      render(<TableSkeleton columns={twoColumns} delay={1000} />)
      void act(() => vi.advanceTimersByTime(999))
      expect(document.querySelector('table')).toBeNull()

      void act(() => vi.advanceTimersByTime(1))
      expect(document.querySelector('table')).not.toBeNull()
    })
  })

  describe('cleanup', () => {
    it('clears the timeout on unmount without side effects', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      const { unmount } = render(<TableSkeleton columns={twoColumns} />)
      // Should not be visible yet
      expect(document.querySelector('table')).toBeNull()
      unmount()
      // clearTimeout should have been called (cleanup function)
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })
})
