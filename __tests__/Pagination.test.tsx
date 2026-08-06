import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryParams } from '@/hooks/useQuery'

const { useQueryMock, setQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  setQueryMock: vi.fn()
}))

vi.mock('@/hooks', () => ({
  useQuery: useQueryMock
}))

import { Pagination } from '@/components/Table/Pagination'

const onPage = (page?: string) => {
  useQueryMock.mockReturnValue([
    (page ? { page } : {}) as QueryParams,
    setQueryMock
  ])
}

/**
 * The arrows are icons inside clickable wrappers, so there is no button role to
 * query. Grab the wrappers by their icons: index 0 is left, index 1 is right.
 */
const arrows = (container: HTMLElement) => {
  const icons = Array.from(container.querySelectorAll('svg'))
  return {
    count: icons.length,
    left: icons[0]?.parentElement,
    right: icons[1]?.parentElement
  }
}

describe('Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not page past the last page', async () => {
    onPage('3')
    const { container } = render(<Pagination total={250} pageSize={100} />)

    await userEvent.click(arrows(container).right!)

    expect(setQueryMock).not.toHaveBeenCalled()
  })

  it('pages forward while there are pages left', async () => {
    onPage('2')
    const { container } = render(<Pagination total={250} pageSize={100} />)

    await userEvent.click(arrows(container).right!)

    expect(setQueryMock).toHaveBeenCalledWith({ page: '3' })
  })

  it('treats a total that is an exact multiple of the page size as a single page', async () => {
    onPage()
    const { container } = render(<Pagination total={100} pageSize={100} />)

    await userEvent.click(arrows(container).right!)

    expect(setQueryMock).not.toHaveBeenCalled()
  })

  it('does not page forward from a page beyond the last one', async () => {
    onPage('9')
    const { container } = render(<Pagination total={250} pageSize={100} />)

    await userEvent.click(arrows(container).right!)

    expect(setQueryMock).not.toHaveBeenCalled()
  })

  it('defaults the page size to 100', async () => {
    onPage('2')
    const { container } = render(<Pagination total={150} />)

    await userEvent.click(arrows(container).right!)

    expect(setQueryMock).not.toHaveBeenCalled()
  })

  it('keeps paging forward when the total is unknown', async () => {
    onPage('7')
    const { container } = render(<Pagination />)

    await userEvent.click(arrows(container).right!)

    expect(setQueryMock).toHaveBeenCalledWith({ page: '8' })
  })

  it('renders no arrows when there are no hits', () => {
    onPage()
    const { container } = render(<Pagination total={0} pageSize={100} />)

    expect(arrows(container).count).toBe(0)
  })

  it('clears the page param when stepping back to the first page', async () => {
    onPage('2')
    const { container } = render(<Pagination total={250} pageSize={100} />)

    await userEvent.click(arrows(container).left!)

    expect(setQueryMock).toHaveBeenCalledWith({ page: undefined })
  })

  it('does not page back from the first page', async () => {
    onPage()
    const { container } = render(<Pagination total={250} pageSize={100} />)

    await userEvent.click(arrows(container).left!)

    expect(setQueryMock).not.toHaveBeenCalled()
  })
})
