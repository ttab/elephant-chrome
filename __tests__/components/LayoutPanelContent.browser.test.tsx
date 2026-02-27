import { render } from 'vitest-browser-react'

import type { YDocument } from '@/modules/yjs/hooks'
import * as Y from 'yjs'
import { useLayouts } from '@/hooks/baboon/useLayouts'
import { LayoutPanelContent } from '@/views/PrintEditor/components/LayoutPanelContent'
import type { SWRResponse } from 'swr'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/modules/yjs/hooks/useYValue'

vi.mock('@/hooks/baboon/useLayouts', () => ({
  useLayouts: vi.fn()
}))

vi.mock('@/modules/yjs/hooks/useYValue', () => ({
  useYValue: vi.fn()
}))

let capturedOnLayoutSlotChange: ((name: string) => void) | undefined

vi.mock('@/views/PrintEditor/components/LayoutsSelect', () => ({
  LayoutsSelect: ({
    onLayoutSlotChange
  }: { onLayoutSlotChange?: (name: string) => void }) => {
    capturedOnLayoutSlotChange = onLayoutSlotChange
    return <div>LayoutsSelect Mock</div>
  }
}))

vi.mock('@/views/PrintEditor/components/Position', () => ({
  Position: () => (
    <div>Position Mock</div>
  )
}))

vi.mock('@/views/PrintEditor/components/Additionals', () => ({
  Additionals: () => (
    <div>Additionals Mock</div>
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

  it('renders all main elements', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    await expect.element(
      screen.getByText('LayoutsSelect Mock')
    ).toBeInTheDocument()
    await expect.element(
      screen.getByText('Position Mock')
    ).toBeInTheDocument()
    await expect.element(
      screen.getByText('Additionals Mock')
    ).toBeInTheDocument()
  })

  it('displays the link title in readonly input', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    const input = screen.getByRole('textbox')
    await expect.element(input).toBeInTheDocument()
    await expect.element(input).toHaveValue('Test Article')
    await expect.element(input).toHaveAttribute('readonly')
    await expect(document.body).toMatchScreenshot()
  })

  it('calls onPreview when preview button is clicked', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    const buttons = screen.container.querySelectorAll(
      'button'
    )
    const previewButton = buttons[0]
    previewButton.click()

    await vi.waitFor(() => {
      expect(mockProps.onPreview).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onRequestDelete when delete button is clicked', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    const buttons = screen.container.querySelectorAll(
      'button'
    )
    const deleteButton = buttons[2]
    deleteButton.click()

    await vi.waitFor(() => {
      expect(mockProps.onRequestDelete).toHaveBeenCalledTimes(1)
    })
    await expect(document.body).toMatchScreenshot()
  })

  it('calls onToggleSelection when checkbox is clicked', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    await screen.getByRole('checkbox').click()

    await vi.waitFor(() => {
      expect(mockProps.onToggleSelection).toHaveBeenCalledTimes(1)
    })
    await expect(document.body).toMatchScreenshot()
  })

  it('reflects isSelected state in checkbox', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} isSelected={false} />
    )

    await expect.element(
      screen.getByRole('checkbox')
    ).not.toBeChecked()

    await screen.rerender(
      <LayoutPanelContent {...mockProps} isSelected={true} />
    )

    await expect.element(
      screen.getByRole('checkbox')
    ).toBeChecked()
  })

  it('applies custom className and panelClassName', async () => {
    const screen = await render(
      <LayoutPanelContent
        {...mockProps}
        className='custom-class'
        panelClassName='panel-class'
      />
    )

    const panel = screen.container.firstChild as HTMLElement
    expect(panel.classList.contains('custom-class')).toBe(true)
    expect(panel.classList.contains('panel-class')).toBe(true)
  })

  it('passes correct basePath to child components', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    await expect.element(
      screen.getByText('LayoutsSelect Mock')
    ).toBeInTheDocument()
    await expect.element(
      screen.getByText('Position Mock')
    ).toBeInTheDocument()
    await expect.element(
      screen.getByText('Additionals Mock')
    ).toBeInTheDocument()
  })

  it('fetches layout data using useLayouts hook', async () => {
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

    await render(<LayoutPanelContent {...mockProps} />)

    expect(mockUseLayouts).toHaveBeenCalledWith('layout-123')
  })

  it('renders with empty linkTitle', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} linkTitle={undefined} />
    )

    await expect.element(
      screen.getByRole('textbox')
    ).toHaveValue('')
    await expect(document.body).toMatchScreenshot()
  })

  it('has proper grid layout structure', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    const panel = screen.container.firstChild as HTMLElement
    expect(panel.classList.contains('grid')).toBe(true)
    expect(panel.classList.contains('grid-cols-12')).toBe(true)
  })

  it('has preview button with correct icon', async () => {
    const screen = await render(
      <LayoutPanelContent {...mockProps} />
    )

    const buttons = screen.container.querySelectorAll('button')
    const previewButton = buttons[0]
    expect(previewButton?.querySelector('svg')).toBeTruthy()
  })

  it('forwards ref correctly', async () => {
    const ref = vi.fn()
    await render(<LayoutPanelContent {...mockProps} ref={ref} />)

    expect(ref).toHaveBeenCalled()
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement)
  })

  it('passes additional HTML attributes', async () => {
    const screen = await render(
      <LayoutPanelContent
        {...mockProps}
        data-custom='test-value'
        aria-label='Test Panel'
      />
    )

    const panel = screen.container.firstChild as HTMLElement
    expect(panel.getAttribute('data-custom')).toBe('test-value')
    expect(panel.getAttribute('aria-label')).toBe('Test Panel')
  })

  it('passes onLayoutSlotChange to LayoutsSelect', async () => {
    await render(<LayoutPanelContent {...mockProps} />)

    expect(capturedOnLayoutSlotChange).toBeTypeOf('function')
  })

  it('resets additionals to slot defaults when layout slot changes',
    async () => {
      const mockSetAdditionals = vi.fn()
      vi.mocked(useYValue).mockReturnValue(
        [undefined, mockSetAdditionals]
      )

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
                    Block.create({
                      type: 'tt/print-feature',
                      name: 'feature-1',
                      value: 'true'
                    }),
                    Block.create({
                      type: 'tt/print-feature',
                      name: 'feature-2',
                      value: 'false'
                    })
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

      await render(<LayoutPanelContent {...mockProps} />)

      capturedOnLayoutSlotChange?.('Slot A')

      expect(mockSetAdditionals).toHaveBeenCalledTimes(1)
      const defaults = mockSetAdditionals.mock.calls[0][0] as Block[]
      expect(defaults).toHaveLength(2)
      expect(defaults[0].name).toBe('feature-1')
      expect(defaults[0].value).toBe('true')
      expect(defaults[1].name).toBe('feature-2')
      expect(defaults[1].value).toBe('false')
    })

  it('resets additionals to empty when slot has no features',
    async () => {
      const mockSetAdditionals = vi.fn()
      vi.mocked(useYValue).mockReturnValue(
        [undefined, mockSetAdditionals]
      )

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

      await render(<LayoutPanelContent {...mockProps} />)

      capturedOnLayoutSlotChange?.('Slot B')

      expect(mockSetAdditionals).toHaveBeenCalledWith([])
    })
})
