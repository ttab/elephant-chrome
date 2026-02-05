import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { useQuery } from '@/hooks/useQuery'

// Mock useQuery hook
vi.mock('@/hooks/useQuery', () => ({
  useQuery: vi.fn()
}))

const mockUseQuery = vi.mocked(useQuery)

describe('SearchBar', () => {
  const mockSetQuery = vi.fn()
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    mockUseQuery.mockReturnValue([{}, mockSetQuery])
  })

  describe('rendering', () => {
    it('renders with default placeholder', () => {
      render(<SearchBar />)
      expect(screen.getByPlaceholderText('Sök')).toBeInTheDocument()
    })

    it('renders with custom placeholder', () => {
      render(<SearchBar placeholder='Search documents...' />)
      expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument()
    })

    it('applies custom className to wrapper', () => {
      const { container } = render(<SearchBar className='custom-class' />)
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('applies custom inputClassName', () => {
      render(<SearchBar inputClassName='custom-input' />)
      const input = screen.getByRole('combobox')
      expect(input).toHaveClass('custom-input')
    })

    it('applies default inputClassName when none provided', () => {
      render(<SearchBar />)
      const input = screen.getByRole('combobox')
      expect(input).toHaveClass('h-9')
    })
  })

  describe('controlled mode', () => {
    it('displays controlled value', () => {
      render(<SearchBar value='test query' onChange={mockOnChange} />)
      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('test query')
    })

    it('calls onChange immediately on input change', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar value='' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'a')

      await vi.waitFor(() => expect(mockOnChange).toHaveBeenCalledWith('a'), { timeout: 1000 })
    })

    it('calls onChange on Enter key', async () => {
      const user = userEvent.setup()
      render(<SearchBar value='test' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('test')
    })

    it('does not update URL query params in controlled mode', async () => {
      const user = userEvent.setup()
      render(<SearchBar value='' onChange={mockOnChange} searchType='plannings' />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test')

      expect(mockSetQuery).not.toHaveBeenCalled()
    })

    it('handles empty string value', () => {
      render(<SearchBar value='' onChange={mockOnChange} />)
      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('')
    })

    it('handles clearing input in controlled mode', () => {
      const { rerender } = render(<SearchBar value='test' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('test')

      // Simulate clearing by updating the controlled value
      rerender(<SearchBar value='' onChange={mockOnChange} />)
      expect(input).toHaveValue('')
    })

    it('stays empty when backspacing to empty string with query param present', () => {
      mockUseQuery.mockReturnValue([{ query: 'test' }, mockSetQuery])
      const { rerender } = render(<SearchBar value='test' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('test')

      // Simulate backspacing to empty - should not fall back to query param
      rerender(<SearchBar value='' onChange={mockOnChange} />)
      expect(input).toHaveValue('')
      expect(input).not.toHaveValue('test')
    })
  })

  describe('uncontrolled mode', () => {
    it('manages internal state', async () => {
      const user = userEvent.setup()
      render(<SearchBar />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test query')

      expect(input).toHaveValue('test query')
    })

    it('updates URL query params on Enter', async () => {
      const user = userEvent.setup()
      render(<SearchBar searchType='plannings' />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test{Enter}')

      expect(mockSetQuery).toHaveBeenCalledWith({
        type: 'plannings',
        query: 'test'
      })
    })

    it('calls onChange callback on Enter if provided', async () => {
      const user = userEvent.setup()
      render(<SearchBar onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('test')
    })

    it('initializes with query param value', () => {
      mockUseQuery.mockReturnValue([{ query: 'initial query' }, mockSetQuery])
      const { unmount } = render(<SearchBar />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('initial query')

      unmount()
    })

    it('handles non-string query param gracefully', () => {
      // @ts-expect-error - testing non-string query param
      mockUseQuery.mockReturnValue([{ query: 123 }, mockSetQuery])
      const { unmount } = render(<SearchBar />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('')

      unmount()
    })

    it('handles undefined query param', () => {
      mockUseQuery.mockReturnValue([{ query: undefined }, mockSetQuery])
      const { unmount } = render(<SearchBar />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('')

      unmount()
    })

    it('does not update URL on typing, only on Enter', async () => {
      const user = userEvent.setup()
      render(<SearchBar searchType='plannings' />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test')

      expect(mockSetQuery).not.toHaveBeenCalled()
    })

    it('includes searchType in query params', async () => {
      const user = userEvent.setup()
      render(<SearchBar searchType='articles' />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'news{Enter}')

      expect(mockSetQuery).toHaveBeenCalledWith({
        type: 'articles',
        query: 'news'
      })
    })

    it('submits without searchType when not provided', async () => {
      const user = userEvent.setup()
      render(<SearchBar />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'search{Enter}')

      expect(mockSetQuery).toHaveBeenCalledWith({
        type: undefined,
        query: 'search'
      })
    })
  })

  describe('keyboard interactions', () => {
    it('submits on Enter key in controlled mode', async () => {
      const user = userEvent.setup()
      render(<SearchBar value='query' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('query')
    })

    it('submits on Enter key in uncontrolled mode', async () => {
      const user = userEvent.setup()
      render(<SearchBar searchType='events' />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'conference{Enter}')

      expect(mockSetQuery).toHaveBeenCalledWith({
        type: 'events',
        query: 'conference'
      })
    })

    it('does not submit on other keys', async () => {
      const user = userEvent.setup()
      render(<SearchBar searchType='plannings' />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test')
      await user.keyboard('{Tab}')

      expect(mockSetQuery).not.toHaveBeenCalled()
    })

    it('submits empty string on Enter when input is empty', async () => {
      const user = userEvent.setup()
      render(<SearchBar onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('')
    })
  })

  describe('edge cases', () => {
    it('handles rapid input changes in controlled mode', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar value='' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'abc')

      await vi.waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith('abc')
      }, { timeout: 1000 })
    })

    it('handles rapid input changes in uncontrolled mode', async () => {
      const user = userEvent.setup({ delay: 1 })
      render(<SearchBar />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test')

      expect(input).toHaveValue('test')
    })

    it('handles clearing input in controlled mode', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar value='test' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.clear(input)

      await vi.waitFor(() => expect(mockOnChange).toHaveBeenCalledWith(''), { timeout: 1000 })
    })

    it('handles special characters', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar value='' onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'test@#$%')

      await vi.waitFor(() => expect(mockOnChange).toHaveBeenLastCalledWith('test@#$%'), { timeout: 1000 })
    })

    it('handles Swedish characters', async () => {
      const user = userEvent.setup()
      render(<SearchBar />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'åäö')

      expect(input).toHaveValue('åäö')
    })
  })

  describe('integration scenarios', () => {
    it('transitions from empty to filled state', async () => {
      const user = userEvent.setup()
      render(<SearchBar />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('')

      await user.type(input, 'search term')
      expect(input).toHaveValue('search term')
    })

    it('maintains controlled value across re-renders', () => {
      const { rerender } = render(<SearchBar value='initial' onChange={mockOnChange} />)
      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('initial')

      rerender(<SearchBar value='updated' onChange={mockOnChange} />)
      expect(input).toHaveValue('updated')
    })

    it('respects query param changes in uncontrolled mode', () => {
      mockUseQuery.mockReturnValue([{ query: 'first' }, mockSetQuery])
      const { rerender, unmount } = render(<SearchBar />)

      let input = screen.getByRole('combobox')
      expect(input).toHaveValue('first')

      mockUseQuery.mockReturnValue([{ query: 'second' }, mockSetQuery])
      rerender(<SearchBar />)

      input = screen.getByRole('combobox')
      expect(input).toHaveValue('second')

      unmount()
    })

    it('handles switching between controlled and uncontrolled (controlled first)', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<SearchBar value='controlled' onChange={mockOnChange} />)

      let input = screen.getByRole('combobox')
      expect(input).toHaveValue('controlled')

      // Switch to uncontrolled
      rerender(<SearchBar />)
      input = screen.getByRole('combobox')

      await user.type(input, 'uncontrolled')
      expect(input).toHaveValue('uncontrolled')
    })
  })
})
