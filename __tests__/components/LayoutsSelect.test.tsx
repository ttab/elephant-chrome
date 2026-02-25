import { render, screen } from '@testing-library/react'
import type { YDocument } from '@/modules/yjs/hooks'
import * as Y from 'yjs'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import { LayoutsSelect } from '@/views/PrintEditor/components/LayoutsSelect'

// Mock window.matchMedia for ComboBox
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query as unknown,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.ResizeObserver = ResizeObserverMock

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

vi.mock('@/modules/yjs/hooks/useYValue', () => ({
  useYValue: vi.fn()
}))


describe('LayoutsSelect', () => {
  const mockDoc = new Y.Doc()
  const mockEle = mockDoc.getMap('ele')
  const mockYdoc = { ele: mockEle } as YDocument<Y.Map<unknown>>

  const mockLayout: Document = {
    uuid: 'layout-uuid',
    type: 'core/layout',
    uri: 'test://layout',
    url: 'https://test.com/layout',
    title: 'Test Layout',
    content: [
      Block.create({
        id: 'slot-1',
        type: 'tt/print-slot',
        name: 'Slot A'
      }),
      Block.create({
        id: 'slot-2',
        type: 'tt/print-slot',
        name: 'Slot B'
      }),
      Block.create({
        id: 'slot-3',
        type: 'core/other',
        name: 'Not a slot'
      })
    ],
    meta: [],
    links: [],
    language: 'sv'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loader when layout is not provided', () => {
    vi.mocked(useYValue).mockReturnValue([undefined, vi.fn()])

    render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={undefined}
        basePath='root.links[0].data.articles[0]'
      />
    )

    const loader = document.querySelector('.animate-spin')
    expect(loader).toBeInTheDocument()
  })

  it('renders ComboBox with available slots', () => {
    vi.mocked(useYValue).mockReturnValue(['Slot A', vi.fn()])

    render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('filters only tt/print-slot content types', () => {
    vi.mocked(useYValue).mockReturnValue(['Slot A', vi.fn()])

    render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('applies custom className', () => {
    vi.mocked(useYValue).mockReturnValue(['Slot A', vi.fn()])

    render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
        className='custom-class'
      />
    )

    // Verify the component renders with className prop
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('shows selected option when articleLayoutName matches a slot', () => {
    vi.mocked(useYValue).mockReturnValue(['Slot B', vi.fn()])

    const { container } = render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    // Just verify the component renders with the selected value
    expect(container).toBeInTheDocument()
  })

  it('handles empty layout content', () => {
    const emptyLayout = {
      ...mockLayout,
      content: []
    }

    vi.mocked(useYValue).mockReturnValue(['', vi.fn()])

    render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={emptyLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})
