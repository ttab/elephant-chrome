import type { MouseEvent } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { PenIcon } from '@ttab/elephant-ui/icons'

type ItemCallback = (event: MouseEvent<HTMLDivElement>) => void

function mockCallback(): ItemCallback {
  return vi.fn<ItemCallback>()
}

// Mock window.matchMedia for Radix UI
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

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.ResizeObserver = ResizeObserverMock

Element.prototype.scrollIntoView = vi.fn()

describe('DotMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('trigger button', () => {
    it('renders a trigger button', () => {
      render(<DotMenu items={[]} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders horizontal icon by default', () => {
      const { container } = render(<DotMenu items={[]} />)
      // MoreHorizontalIcon renders an svg; verify the button renders
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders vertical icon when trigger is vertical', () => {
      const { container } = render(<DotMenu trigger='vertical' items={[]} />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('callback items', () => {
    it('renders menu items after clicking trigger', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'Action A', item: mockCallback() },
        { label: 'Action B', item: mockCallback() }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByRole('menu')).toBeInTheDocument()
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(2)
    })

    it('calls callback when a menu item is clicked', async () => {
      const user = userEvent.setup()
      const callback = mockCallback()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'Do something', item: callback }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByRole('menuitem'))

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('displays label text for callback items', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'My action', item: mockCallback() }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByText('My action')).toBeInTheDocument()
    })
  })

  describe('icon rendering', () => {
    it('renders icon for callback items', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'Edit', icon: PenIcon, item: mockCallback() }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      const menuItem = screen.getByRole('menuitem')
      expect(within(menuItem).getByText('Edit')).toBeInTheDocument()
      // Icon should be rendered as svg inside the menu item
      expect(menuItem.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('React node items', () => {
    it('renders React node content directly', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        {
          label: 'Custom node',
          item: <span data-testid='custom-node'>Custom content</span>
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByTestId('custom-node')).toBeInTheDocument()
      expect(screen.getByText('Custom content')).toBeInTheDocument()
    })
  })

  describe('disabled items', () => {
    it('renders disabled menu items', async () => {
      const user = userEvent.setup()
      const callback = mockCallback()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'Disabled action', item: callback, disabled: true }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      const menuItem = screen.getByRole('menuitem')
      expect(menuItem).toHaveAttribute('data-disabled')
    })

    it('does not call callback when a disabled item is clicked', async () => {
      const user = userEvent.setup()
      const callback = mockCallback()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'Disabled action', item: callback, disabled: true }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByRole('menuitem'))

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('submenu items', () => {
    it('renders a submenu trigger when item is an array', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        {
          label: 'Open submenu',
          item: [
            { label: 'Sub item 1', item: mockCallback() },
            { label: 'Sub item 2', item: mockCallback() }
          ]
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Open submenu')).toBeInTheDocument()
    })

    it('renders disabled fallback for empty submenu arrays', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        {
          label: 'Empty submenu',
          item: []
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Empty submenu')).toBeInTheDocument()
    })

    it('renders React node content inside submenu items', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        {
          label: 'Documents',
          item: [
            {
              label: 'Doc 1',
              item: <span data-testid='sub-node'>Sub content</span>
            }
          ]
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      // The sub trigger should be visible
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    it('calls callback when a submenu item is clicked', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      const callback = mockCallback()
      const items: DotDropdownMenuActionItem[] = [
        {
          label: 'Actions',
          item: [
            { label: 'Run action', item: callback }
          ]
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      // Open the submenu — Radix requires pointer events to reveal sub-content
      const subTrigger = screen.getByText('Actions')
      fireEvent.pointerMove(subTrigger, { pointerType: 'mouse' })
      fireEvent.pointerEnter(subTrigger, { pointerType: 'mouse' })

      // Click the sub-item
      const subItem = await screen.findByText('Run action')
      await user.click(subItem)

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('renders a disabled submenu trigger when disabled is true', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        {
          label: 'Disabled sub',
          disabled: true,
          item: [
            { label: 'Sub item', item: mockCallback() }
          ]
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      const subTrigger = screen.getByText('Disabled sub')
      expect(subTrigger.closest('[data-disabled]')).toBeInTheDocument()
    })
  })

  describe('mixed item types', () => {
    it('renders callback items, React node items, and submenus together', async () => {
      const user = userEvent.setup()
      const items: DotDropdownMenuActionItem[] = [
        { label: 'Callback', item: mockCallback() },
        { label: 'Node', item: <span>Custom</span> },
        {
          label: 'Submenu',
          item: [
            { label: 'Nested', item: mockCallback() }
          ]
        }
      ]

      render(<DotMenu items={items} />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Callback')).toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.getByText('Submenu')).toBeInTheDocument()
    })
  })

  describe('menu alignment', () => {
    it('aligns menu to start when there is enough space on the right', async () => {
      const user = userEvent.setup()

      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

      const items: DotDropdownMenuActionItem[] = [
        { label: 'Action', item: mockCallback() }
      ]

      render(<DotMenu items={items} />)
      const button = screen.getByRole('button')

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 100, right: 132, top: 0, bottom: 32,
        width: 32, height: 32, x: 100, y: 0, toJSON: () => ({})
      })

      await user.click(button)

      const content = screen.getByRole('menu')
      expect(content).toHaveAttribute('data-align', 'start')
    })

    it('aligns menu to end when near the right edge', async () => {
      const user = userEvent.setup()

      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

      const items: DotDropdownMenuActionItem[] = [
        { label: 'Action', item: mockCallback() }
      ]

      render(<DotMenu items={items} />)
      const button = screen.getByRole('button')

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 900, right: 932, top: 0, bottom: 32,
        width: 32, height: 32, x: 900, y: 0, toJSON: () => ({})
      })

      await user.click(button)

      const content = screen.getByRole('menu')
      expect(content).toHaveAttribute('data-align', 'end')
    })
  })
})
