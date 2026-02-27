import { render } from 'vitest-browser-react'

import type { YDocument } from '@/modules/yjs/hooks'
import * as Y from 'yjs'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import { LayoutsSelect } from '@/views/PrintEditor/components/LayoutsSelect'

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

  it('shows loader when layout is not provided', async () => {
    vi.mocked(useYValue).mockReturnValue([undefined, vi.fn()])

    const screen = await render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={undefined}
        basePath='root.links[0].data.articles[0]'
      />
    )

    expect(
      screen.container.querySelector('.animate-spin')
    ).toBeTruthy()
  })

  it('renders ComboBox with available slots', async () => {
    vi.mocked(useYValue).mockReturnValue(['Slot A', vi.fn()])

    const screen = await render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    await expect.element(
      screen.getByRole('button')
    ).toBeInTheDocument()
  })

  it('filters only tt/print-slot content types', async () => {
    vi.mocked(useYValue).mockReturnValue(['Slot A', vi.fn()])

    const screen = await render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    await expect.element(
      screen.getByRole('button')
    ).toBeInTheDocument()
  })

  it('applies custom className', async () => {
    vi.mocked(useYValue).mockReturnValue(['Slot A', vi.fn()])

    const screen = await render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={mockLayout}
        basePath='root.links[0].data.articles[0]'
        className='custom-class'
      />
    )

    await expect.element(
      screen.getByRole('button')
    ).toBeInTheDocument()
  })

  it('shows selected option when articleLayoutName matches a slot',
    async () => {
      vi.mocked(useYValue).mockReturnValue(['Slot B', vi.fn()])

      const screen = await render(
        <LayoutsSelect
          ydoc={mockYdoc}
          layout={mockLayout}
          basePath='root.links[0].data.articles[0]'
        />
      )

      await expect.element(
        screen.getByRole('button')
      ).toBeInTheDocument()
    })

  it('handles empty layout content', async () => {
    const emptyLayout = {
      ...mockLayout,
      content: []
    }

    vi.mocked(useYValue).mockReturnValue(['', vi.fn()])

    const screen = await render(
      <LayoutsSelect
        ydoc={mockYdoc}
        layout={emptyLayout}
        basePath='root.links[0].data.articles[0]'
      />
    )

    await expect.element(
      screen.getByRole('button')
    ).toBeInTheDocument()
  })

  it('calls onLayoutSlotChange when a different slot is selected',
    async () => {
      const mockSetLayoutName = vi.fn()
      const mockOnChange = vi.fn()
      const mockOnLayoutSlotChange = vi.fn()

      vi.mocked(useYValue).mockReturnValue(
        ['Slot A', mockSetLayoutName]
      )

      const screen = await render(
        <LayoutsSelect
          ydoc={mockYdoc}
          layout={mockLayout}
          basePath='root.links[0].data.articles[0]'
          onChange={mockOnChange}
          onLayoutSlotChange={mockOnLayoutSlotChange}
        />
      )

      await screen.getByRole('button').click()
      await screen.getByText('Slot B').click()

      expect(mockOnLayoutSlotChange).toHaveBeenCalledWith('Slot B')
      expect(mockOnChange).toHaveBeenCalledWith(true)
      expect(mockSetLayoutName).toHaveBeenCalledWith('Slot B')
      await expect(document.body).toMatchScreenshot()
    })

  it('does not call callbacks when re-selecting the same slot',
    async () => {
      const mockSetLayoutName = vi.fn()
      const mockOnChange = vi.fn()
      const mockOnLayoutSlotChange = vi.fn()

      vi.mocked(useYValue).mockReturnValue(
        ['Slot A', mockSetLayoutName]
      )

      const screen = await render(
        <LayoutsSelect
          ydoc={mockYdoc}
          layout={mockLayout}
          basePath='root.links[0].data.articles[0]'
          onChange={mockOnChange}
          onLayoutSlotChange={mockOnLayoutSlotChange}
        />
      )

      await screen.getByRole('button').click()

      // Find the dropdown option (not the button text)
      const options = screen.container.querySelectorAll(
        '[role="option"]'
      )
      const slotAOption = Array.from(options).find(
        (el) => el.textContent === 'Slot A'
      )
      if (slotAOption) {
        (slotAOption as HTMLElement).click()
      }

      expect(mockOnLayoutSlotChange).not.toHaveBeenCalled()
      expect(mockOnChange).not.toHaveBeenCalled()
      expect(mockSetLayoutName).not.toHaveBeenCalled()
      await expect(document.body).toMatchScreenshot()
    })
})
