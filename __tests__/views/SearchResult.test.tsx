import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'

const { useDocumentsMock, setQueryMock, paginationQueryMock } = vi.hoisted(() => ({
  useDocumentsMock: vi.fn(),
  setQueryMock: vi.fn(),
  paginationQueryMock: vi.fn()
}))

vi.mock('@/hooks/index/useDocuments', () => ({
  useDocuments: useDocumentsMock
}))

// Pagination reads its page from the '@/hooks' barrel, SearchResult from the
// module directly. They resolve to separate registry entries, so both are stubbed.
vi.mock('@/hooks', () => ({
  useQuery: paginationQueryMock
}))

vi.mock('@/hooks/useQuery', () => ({
  useQuery: () => [{}]
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ locale: 'sv-SE', timeZone: 'Europe/Stockholm' })
}))

vi.mock('@/hooks/useSections', () => ({ useSections: () => [] }))
vi.mock('@/hooks/useOrganisers', () => ({ useOrganisers: () => [] }))
vi.mock('@/hooks/useAuthors', () => ({ useAuthors: () => [] }))

vi.mock('@/views/SearchOverview/lib/createSearchColumns', () => ({
  createSearchColumns: () => []
}))

vi.mock('@/components/Table', () => ({
  Table: () => <div data-testid='table' />
}))

vi.mock('@/views/SearchOverview/Toolbar', () => ({
  Toolbar: () => <div data-testid='toolbar' />
}))

import { SearchResult } from '@/views/SearchOverview/SearchResult'

const onPage = (page?: string) => {
  paginationQueryMock.mockReturnValue([page ? { page } : {}, setQueryMock])
}

const renderResult = ({ total, isLoading = false, page }: {
  total?: number
  isLoading?: boolean
  page?: string
}) => {
  onPage(page)
  useDocumentsMock.mockReturnValue({ error: undefined, isLoading, total })

  return render(<SearchResult searchType={'plannings' as SearchKeys} page={Number(page ?? 1)} />)
}

/** Arrows are icons in clickable wrappers: index 0 is left, index 1 is right. */
const rightArrow = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('svg'))[1]?.parentElement

describe('SearchResult pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the hit count through so the last page cannot be paged past', async () => {
    const { container } = renderResult({ total: 250, page: '3' })

    await userEvent.click(rightArrow(container)!)

    expect(setQueryMock).not.toHaveBeenCalled()
  })

  it('still pages forward while pages remain', async () => {
    const { container } = renderResult({ total: 250, page: '2' })

    await userEvent.click(rightArrow(container)!)

    expect(setQueryMock).toHaveBeenCalledWith({ page: '3' })
  })

  it('fetches with the same page size that bounds the pagination', () => {
    renderResult({ total: 250 })

    expect(useDocumentsMock).toHaveBeenCalledWith(
      expect.objectContaining({ size: 100 })
    )
  })

  it('renders the pagination while the results are loading', () => {
    const { container } = renderResult({ total: undefined, isLoading: true })

    expect(container.querySelector('[data-testid="table"]')).toBeNull()
    expect(rightArrow(container)).toBeTruthy()
  })
})
