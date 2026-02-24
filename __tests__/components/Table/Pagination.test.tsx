import type { Mock } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useNavigation } from '@/navigation/hooks/useNavigation'
import { useView } from '@/hooks/useView'
import { initializeNavigationState } from '@/navigation/lib'
import type { ViewProviderState } from '@/types/index'
import type { NavigationAction } from '@/types/index'
import type { Dispatch } from 'react'

const BASE_URL = import.meta.env.BASE_URL

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))

vi.mock('@/hooks/useView', () => ({
  useView: vi.fn()
}))

const mockState = initializeNavigationState()
const mockDispatch = vi.fn() as Dispatch<NavigationAction>

const VIEW_ID = 'test-view-pagination'

// Push initial history state
history.pushState({
  viewId: VIEW_ID,
  contentState: [
    {
      viewId: VIEW_ID,
      name: 'SearchOverview',
      props: {},
      path: `${BASE_URL}/searchoverview`
    }
  ]
}, '', `${BASE_URL}/searchoverview`)

vi.mocked(useNavigation).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

vi.mocked(useView).mockReturnValue({
  viewId: VIEW_ID,
  isActive: true
} as ViewProviderState)

import { Pagination } from '@/components/Table/Pagination'

describe('Pagination', () => {
  type ReplaceState = typeof window.history['replaceState']
  let replaceStateMock: Mock<ReplaceState>

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '',
        href: `https://example.com${BASE_URL}/searchoverview`,
        pathname: `${BASE_URL}/searchoverview`
      }
    })

    replaceStateMock = vi.spyOn(window.history, 'replaceState').mockImplementation((_, __, url) => {
      if (typeof url === 'string') {
        const search = url.split('?')[1] || ''
        Object.defineProperty(window, 'location', {
          writable: true,
          value: {
            search: search ? `?${search}` : '',
            href: `https://example.com${BASE_URL}/searchoverview${search ? `?${search}` : ''}`,
            pathname: `${BASE_URL}/searchoverview`
          }
        })
      }
    })

    vi.mocked(useNavigation).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch
    })

    vi.mocked(useView).mockReturnValue({
      viewId: VIEW_ID,
      isActive: true
    } as ViewProviderState)
  })

  afterEach(() => {
    replaceStateMock.mockRestore()
  })

  it('renders left and right arrow buttons', () => {
    render(<Pagination total={500} />)
    // Two clickable icon containers
    const divs = document.querySelectorAll('[class*="flex items-center gap-2"]')
    expect(divs.length).toBeGreaterThanOrEqual(2)
  })

  it('shows page number between the buttons', () => {
    render(<Pagination total={500} />)
    // Default page is "1"
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('left arrow is disabled when page is 1', () => {
    render(<Pagination total={500} />)
    // Page defaults to 1; disabled icon container has no cursor-pointer class
    const allDivs = document.querySelectorAll('div')
    const iconContainers = Array.from(allDivs).filter(
      (d) => d.className.includes('flex items-center gap-2') && !d.className.includes('justify')
    )
    // The first icon container is the left arrow — disabled on page 1
    const leftIconContainer = iconContainers.find((d) => !d.className.includes('cursor-pointer'))
    expect(leftIconContainer).toBeDefined()
    expect(leftIconContainer!.className).not.toContain('cursor-pointer')
  })

  it('clicking left arrow on page 2 goes to page 1 (removes query param)', () => {
    // Set page=2 in search
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?page=2',
        href: `https://example.com${BASE_URL}/searchoverview?page=2`,
        pathname: `${BASE_URL}/searchoverview`
      }
    })
    render(<Pagination total={500} />)
    const allDivs = document.querySelectorAll('div')
    // Left arrow on page 2 is enabled (has cursor-pointer)
    const clickableDivs = Array.from(allDivs).filter(
      (d) => d.className.includes('cursor-pointer') && d.className.includes('flex items-center gap-2')
    )
    expect(clickableDivs.length).toBeGreaterThan(0)
    act(() => {
      fireEvent.click(clickableDivs[0])
    })
    // Going to page 1 removes the page param
    expect(replaceStateMock).toHaveBeenCalled()
  })

  it('clicking left arrow on page 3 goes to page 2', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?page=3',
        href: `https://example.com${BASE_URL}/searchoverview?page=3`,
        pathname: `${BASE_URL}/searchoverview`
      }
    })
    render(<Pagination total={1000} />)
    const allDivs = document.querySelectorAll('div')
    // Find left arrow container - it should be cursor-pointer since page > 1
    const clickableDivs = Array.from(allDivs).filter((d) =>
      d.className.includes('cursor-pointer') && d.className.includes('flex items-center gap-2')
    )
    expect(clickableDivs.length).toBeGreaterThan(0)
    act(() => {
      fireEvent.click(clickableDivs[0])
    })

    expect(replaceStateMock).toHaveBeenCalled()
    const callArgs = replaceStateMock.mock.calls[0]
    expect(String(callArgs[2])).toContain('page=2')
  })

  it('right arrow is disabled when on the last page', () => {
    // total=100 -> maxNumberOfPages = floor(100/100)+1 = 2
    // Set page=2 which equals maxNumberOfPages
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?page=2',
        href: `https://example.com${BASE_URL}/searchoverview?page=2`,
        pathname: `${BASE_URL}/searchoverview`
      }
    })
    render(<Pagination total={100} />)
    const allDivs = document.querySelectorAll('div')
    // On last page, right arrow is disabled (no cursor-pointer)
    const disabledContainers = Array.from(allDivs).filter(
      (d) => d.className.includes('flex items-center gap-2')
        && !d.className.includes('justify')
        && !d.className.includes('cursor-pointer')
    )
    // Right arrow should be disabled on last page
    expect(disabledContainers.length).toBeGreaterThan(0)
  })

  it('clicking right arrow increments the page', () => {
    render(<Pagination total={500} />)
    const allDivs = document.querySelectorAll('div')
    // Right arrow should be cursor-pointer on page 1 with total=500
    const clickableDivs = Array.from(allDivs).filter((d) =>
      d.className.includes('cursor-pointer') && d.className.includes('flex items-center gap-2')
    )
    // Right arrow is the last cursor-pointer
    const rightContainer = clickableDivs[clickableDivs.length - 1]
    act(() => {
      fireEvent.click(rightContainer)
    })
    expect(replaceStateMock).toHaveBeenCalled()
    const callArgs = replaceStateMock.mock.calls[0]
    expect(String(callArgs[2])).toContain('page=2')
  })

  it('renders null when total is 0', () => {
    render(<Pagination total={0} />)
    // The outer wrapper div is still rendered, but no buttons/arrows should be inside
    const svgs = document.querySelectorAll('svg')
    expect(svgs).toHaveLength(0)
  })

  it('renders when total is undefined (no upper bound)', () => {
    render(<Pagination total={undefined} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calculates maxNumberOfPages as Math.floor(total / 100) + 1', () => {
    // total=250 -> maxNumberOfPages = floor(250/100)+1 = 3
    // On page 3, right arrow should be disabled (no cursor-pointer)
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?page=3',
        href: `https://example.com${BASE_URL}/searchoverview?page=3`,
        pathname: `${BASE_URL}/searchoverview`
      }
    })
    render(<Pagination total={250} />)
    const allDivs = document.querySelectorAll('div')
    const disabledContainers = Array.from(allDivs).filter(
      (d) => d.className.includes('flex items-center gap-2')
        && !d.className.includes('justify')
        && !d.className.includes('cursor-pointer')
    )
    // Right arrow should be disabled on page 3 (maxPage)
    expect(disabledContainers.length).toBeGreaterThan(0)
  })
})
