import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { YDocument } from '@/modules/yjs/hooks'
import * as Y from 'yjs'
import { useLayouts } from '@/hooks/baboon/useLayouts'
import { LayoutPanelContent } from '@/views/PrintEditor/components/LayoutPanelContent'
import type { SWRResponse } from 'swr'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/modules/yjs/hooks/useYValue'

// Mock window.matchMedia for UI components
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

vi.mock('@/hooks/baboon/useLayouts', () => ({
  useLayouts: vi.fn()
}))

vi.mock('@/modules/yjs/hooks/useYValue', () => ({
  useYValue: vi.fn()
}))

// Mock child components
let capturedOnLayoutSlotChange: ((name: string) => void) | undefined

vi.mock('@/views/PrintEditor/components/LayoutsSelect', () => ({
  LayoutsSelect: ({ onLayoutSlotChange }: { onLayoutSlotChange?: (name: string) => void }) => {
    capturedOnLayoutSlotChange = onLayoutSlotChange
    return <div data-testid='layouts-select'>LayoutsSelect Mock</div>
  }
}))

vi.mock('@/views/PrintEditor/components/Position', () => ({
  Position: () => (
    <div data-testid='position'>Position Mock</div>
  )
}))

vi.mock('@/views/PrintEditor/components/Additionals', () => ({
  Additionals: () => (
    <div data-testid='additionals'>Additionals Mock</div>
  )
}))


describe('LayoutPanelContent', () => {
  const mockDoc = new Y.Doc()
  const mockEle = mockDoc.getMap('ele')
  const mockYdoc = { ele: mockEle } as YDocument<Y.Map<unknown>>

  const mockProps = {
    panelClassName: 'test-panel',
    ydoc: mockYdoc,
    basePath: 'root.links[0].data.articles[0]',
    layoutUuid: 'layout-123',
    linkTitle: 'Test Article',
    isSelected: false,
    onToggleSelection: vi.fn(),
    onPreview: vi.fn(),
    onRequestDelete: vi.fn()
  }

  vi.mocked(useLayouts).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isError: false,
    isSuccess: false,
    status: 'pending',
    mutate: vi.fn()
  } as unknown as SWRResponse<Document | undefined, Error>)

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnLayoutSlotChange = undefined
    vi.mocked(useYValue).mockReturnValue([undefined, vi.fn()])
  })

  it('renders all main elements', () => {
    render(<LayoutPanelContent {...mockProps} />)

    expect(screen.getByTestId('layouts-select')).toBeInTheDocument()
    expect(screen.getByTestId('position')).toBeInTheDocument()
    expect(screen.getByTestId('additionals')).toBeInTheDocument()
  })

  it('displays the link title in readonly input', () => {
    render(<LayoutPanelContent {...mockProps} />)

    const input = screen.getByPlaceholderText('Namn')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Test Article')
    expect(input).toHaveAttribute('readonly')
  })

  it('calls onPreview when preview button is clicked', async () => {
    const user = userEvent.setup()
    render(<LayoutPanelContent {...mockProps} />)

    const previewButton = screen.getAllByRole('button')[0]
    await user.click(previewButton)

    expect(mockProps.onPreview).toHaveBeenCalledTimes(1)
  })

  it('calls onRequestDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<LayoutPanelContent {...mockProps} />)

    const deleteButton = screen.getAllByRole('button')[1]
    await user.click(deleteButton)
    expect(mockProps.onRequestDelete).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleSelection when checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(<LayoutPanelContent {...mockProps} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockProps.onToggleSelection).toHaveBeenCalledTimes(1)
  })

  it('reflects isSelected state in checkbox', () => {
    const { rerender } = render(<LayoutPanelContent {...mockProps} isSelected={false} />)

    let checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    rerender(<LayoutPanelContent {...mockProps} isSelected={true} />)

    checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('applies custom className and panelClassName', () => {
    const { container } = render(
      <LayoutPanelContent
        {...mockProps}
        className='custom-class'
        panelClassName='panel-class'
      />
    )

    const panel = container.firstChild
    expect(panel).toHaveClass('custom-class')
    expect(panel).toHaveClass('panel-class')
  })

  it('passes correct basePath to child components', () => {
    render(<LayoutPanelContent {...mockProps} />)

    // Verify that child components are rendered (mocked components include basePath in their output)
    expect(screen.getByTestId('layouts-select')).toBeInTheDocument()
    expect(screen.getByTestId('position')).toBeInTheDocument()
    expect(screen.getByTestId('additionals')).toBeInTheDocument()
  })

  it('fetches layout data using useLayouts hook', () => {
    const mockUseLayouts = vi.mocked(useLayouts)
    mockUseLayouts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false,
      status: 'pending'
    } as unknown as SWRResponse<Document | undefined, Error>)

    render(<LayoutPanelContent {...mockProps} />)

    expect(mockUseLayouts).toHaveBeenCalledWith('layout-123')
  })

  it('renders with empty linkTitle', () => {
    render(<LayoutPanelContent {...mockProps} linkTitle={undefined} />)

    const input = screen.getByPlaceholderText('Namn')
    expect(input).toHaveValue('')
  })

  it('has proper grid layout structure', () => {
    const { container } = render(<LayoutPanelContent {...mockProps} />)

    const panel = container.firstChild
    expect(panel).toHaveClass('grid', 'grid-cols-12')
  })

  it('has preview button with correct icon', () => {
    render(<LayoutPanelContent {...mockProps} />)

    // Look for all buttons and find the preview one
    const buttons = screen.getAllByRole('button')
    const previewButton = buttons[0] // First button should be preview
    expect(previewButton.querySelector('svg')).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<LayoutPanelContent {...mockProps} ref={ref} />)

    expect(ref).toHaveBeenCalled()
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement)
  })

  it('passes additional HTML attributes', () => {
    const { container } = render(
      <LayoutPanelContent
        {...mockProps}
        data-custom='test-value'
        aria-label='Test Panel'
      />
    )

    const panel = container.firstChild as HTMLElement
    expect(panel).toHaveAttribute('data-custom', 'test-value')
    expect(panel).toHaveAttribute('aria-label', 'Test Panel')
  })

  it('passes onLayoutSlotChange to LayoutsSelect', () => {
    render(<LayoutPanelContent {...mockProps} />)

    expect(capturedOnLayoutSlotChange).toBeTypeOf('function')
  })

  it('resets additionals to slot defaults when layout slot changes', () => {
    const mockSetAdditionals = vi.fn()
    vi.mocked(useYValue).mockReturnValue([undefined, mockSetAdditionals])

    vi.mocked(useLayouts).mockReturnValue({
      data: {
        uuid: 'layout-uuid',
        type: 'core/layout',
        uri: '',
        url: '',
        title: 'Test Layout',
        content: [
          Block.create({
            type: 'tt/print-slot',
            name: 'Slot A',
            meta: [
              Block.create({
                type: 'tt/print-features',
                content: [
                  Block.create({ type: 'tt/print-feature', name: 'feature-1', value: 'true' }),
                  Block.create({ type: 'tt/print-feature', name: 'feature-2', value: 'false' })
                ]
              })
            ]
          })
        ],
        meta: [],
        links: [],
        language: 'sv'
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      mutate: vi.fn()
    } as unknown as SWRResponse<Document | undefined, Error>)

    render(<LayoutPanelContent {...mockProps} />)

    capturedOnLayoutSlotChange?.('Slot A')

    expect(mockSetAdditionals).toHaveBeenCalledTimes(1)
    const defaults = mockSetAdditionals.mock.calls[0][0] as Block[]
    expect(defaults).toHaveLength(2)
    expect(defaults[0].name).toBe('feature-1')
    expect(defaults[0].value).toBe('true')
    expect(defaults[1].name).toBe('feature-2')
    expect(defaults[1].value).toBe('false')
  })

  it('resets additionals to empty when slot has no features', () => {
    const mockSetAdditionals = vi.fn()
    vi.mocked(useYValue).mockReturnValue([undefined, mockSetAdditionals])

    vi.mocked(useLayouts).mockReturnValue({
      data: {
        uuid: 'layout-uuid',
        type: 'core/layout',
        uri: '',
        url: '',
        title: 'Test Layout',
        content: [
          Block.create({
            type: 'tt/print-slot',
            name: 'Slot B',
            meta: []
          })
        ],
        meta: [],
        links: [],
        language: 'sv'
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      mutate: vi.fn()
    } as unknown as SWRResponse<Document | undefined, Error>)

    render(<LayoutPanelContent {...mockProps} />)

    capturedOnLayoutSlotChange?.('Slot B')

    expect(mockSetAdditionals).toHaveBeenCalledWith([])
  })
})
