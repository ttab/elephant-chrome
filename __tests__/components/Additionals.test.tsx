import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import * as Y from 'yjs'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import type { ElementType } from 'react'

// Per-test mocking and dynamic import will be done in beforeEach to ensure mocks are applied
// Problems arise if we try to do this at the top-level due to module caching/hoisting ???
let useYValue: ReturnType<typeof vi.fn> | undefined
let Additionals: ElementType

describe('Additionals', () => {
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
        name: 'test-slot',
        meta: [
          Block.create({
            id: 'meta-1',
            type: 'tt/print-features',
            content: [
              Block.create({
                id: 'feature-1',
                type: 'core/text',
                name: 'Feature 1',
                value: 'feature1'
              }),
              Block.create({
                id: 'feature-2',
                type: 'core/text',
                name: 'Feature 2',
                value: 'feature2'
              })
            ]
          })
        ]
      })
    ],
    meta: [],
    links: [],
    language: 'sv'
  }

  beforeEach(async () => {
    vi.resetModules()
    // Mock the concrete useYValue module before importing the component
    vi.mock('@/modules/yjs/hooks/useYValue', () => ({ useYValue: vi.fn() }))
    const hooks = await import('@/modules/yjs/hooks/useYValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    useYValue = hooks.useYValue as any
    const mod = await import('@/views/PrintEditor/components/Additionals')
    Additionals = mod.Additionals
    vi.clearAllMocks()
  })

  it('shows loader when layout is not provided', () => {
    vi.mocked(useYValue)
      ?.mockReturnValueOnce([undefined, vi.fn()]) // articleAdditionals
      .mockReturnValueOnce(['test-slot', vi.fn()]) // articleLayoutName

    render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={undefined}
      />
    )

    const loader = document.querySelector('.animate-spin')
    expect(loader).toBeInTheDocument()
  })

  it('returns null when no items are available', () => {
    const layoutWithoutFeatures = {
      ...mockLayout,
      content: [
        {
          ...mockLayout.content[0],
          meta: []
        }
      ]
    }

    vi.mocked(useYValue)
      ?.mockReturnValueOnce([[], vi.fn()]) // articleAdditionals
      .mockReturnValueOnce(['test-slot', vi.fn()]) // articleLayoutName

    const { container } = render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={layoutWithoutFeatures}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders additionals with checkboxes', () => {
    const mockSetAdditionals = vi.fn()
    const mockAdditionals = [
      { name: 'Feature 1', value: 'true' },
      { name: 'Feature 2', value: 'false' }
    ]

    vi.mocked(useYValue)
      ?.mockImplementationOnce(() => {
        return [mockAdditionals, mockSetAdditionals]
      })
      .mockImplementationOnce(() => {
        return ['test-slot', vi.fn()]
      })

    render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={mockLayout}
      />
    )

    expect(screen.getByText('Tillägg')).toBeInTheDocument()
    expect(screen.getByLabelText('Feature 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Feature 2')).toBeInTheDocument()
  })

  it('toggles checkbox state when clicked', async () => {
    const user = userEvent.setup()
    const mockSetAdditionals = vi.fn()
    const mockAdditionals = [
      { name: 'Feature 1', value: 'false' },
      { name: 'Feature 2', value: 'false' }
    ]

    vi.mocked(useYValue)
      ?.mockReturnValueOnce([mockAdditionals, mockSetAdditionals]) // articleAdditionals
      .mockReturnValueOnce(['test-slot', vi.fn()]) // articleLayoutName

    render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={mockLayout}
      />
    )

    const checkbox1 = screen.getByLabelText('Feature 1')
    await user.click(checkbox1)

    expect(mockSetAdditionals).toHaveBeenCalledWith([
      { name: 'Feature 1', value: 'true' },
      { name: 'Feature 2', value: 'false' }
    ])
  })

  it('toggles from true to false when checked checkbox is clicked', async () => {
    const user = userEvent.setup()
    const mockSetAdditionals = vi.fn()
    const mockAdditionals = [
      { name: 'Feature 1', value: 'true' },
      { name: 'Feature 2', value: 'false' }
    ]

    vi.mocked(useYValue)
      ?.mockReturnValueOnce([mockAdditionals, mockSetAdditionals]) // articleAdditionals
      .mockReturnValueOnce(['test-slot', vi.fn()]) // articleLayoutName

    render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={mockLayout}
      />
    )

    const checkbox1 = screen.getByLabelText('Feature 1')
    await user.click(checkbox1)

    expect(mockSetAdditionals).toHaveBeenCalledWith([
      { name: 'Feature 1', value: 'false' },
      { name: 'Feature 2', value: 'false' }
    ])
  })

  it('handles empty articleAdditionals gracefully', () => {
    const mockSetAdditionals = vi.fn()

    vi.mocked(useYValue)
      ?.mockReturnValueOnce([[], mockSetAdditionals]) // empty articleAdditionals
      .mockReturnValueOnce(['test-slot', vi.fn()]) // articleLayoutName

    render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={mockLayout}
      />
    )

    expect(screen.getByText('Tillägg')).toBeInTheDocument()
    expect(screen.getByLabelText('Feature 1')).toBeInTheDocument()
  })

  it('does not update when articleAdditionals is undefined', async () => {
    const user = userEvent.setup()
    const mockSetAdditionals = vi.fn()

    vi.mocked(useYValue)
      ?.mockReturnValueOnce([undefined, mockSetAdditionals]) // articleAdditionals undefined
      .mockReturnValueOnce(['test-slot', vi.fn()]) // articleLayoutName

    render(
      <Additionals
        ydoc={mockYdoc}
        basePath='root.links[0].data.articles[0]'
        layout={mockLayout}
      />
    )

    // Component should still render with items from layout
    expect(screen.getByText('Tillägg')).toBeInTheDocument()

    const checkbox1 = screen.getByLabelText('Feature 1')
    await user.click(checkbox1)

    // Should not call setter when articleAdditionals is undefined
    expect(mockSetAdditionals).not.toHaveBeenCalled()
  })
})
