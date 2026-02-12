import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateDeliverablePrompt } from '@/views/Planning/components/CreateDeliverablePrompt'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { TemplatePayload } from '@/shared/templates'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { initialState, type RegistryProviderState } from '@/contexts/RegistryProvider'
import i18n from '@/lib/i18n'

// Mock environment variables
const originalEnv = process.env

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    message: vi.fn(),
    dismiss: vi.fn()
  },
  Toaster: vi.fn(() => null)
}))

vi.mocked(useRegistry).mockReturnValue(initialState)

beforeEach(() => {
  vi.clearAllMocks()
})

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv, SYSTEM_LANGUAGE: 'sv-se' }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CreateDeliverablePrompt', () => {
  const mockSaveDocument = vi.fn()
  const mockOnClose = vi.fn()

  const mockYdoc: YDocument<Y.Map<unknown>> = {
    ele: {} as Y.Map<unknown>,
    provider: {
      document: {} as unknown as Y.Doc
    }
  } as YDocument<Y.Map<unknown>>

  const validPayload: TemplatePayload = {
    meta: {
      'core/newsvalue': [Block.create({ value: '3' })]
    },
    links: {
      'core/section': [Block.create({ uuid: 'section-123' })]
    }
  }

  const defaultProps = {
    ydoc: mockYdoc,
    deliverableType: 'article' as const,
    payload: validPayload,
    title: 'Test Title',
    documentLabel: i18n.t('shared:assignmentTypes.text').toLocaleLowerCase(),
    onClose: mockOnClose
  }

  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { name: 'Testy Test' },
    accessToken: 'abc123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveDocument.mockResolvedValue(undefined)

    // Reset useRegistry mock to return repository
    vi.mocked(useRegistry).mockReturnValue({
      repository: {
        saveDocument: mockSaveDocument,
        getMeta: vi.fn(),
        getDocument: vi.fn()
      }
    } as unknown as RegistryProviderState)

    // Reset useSession mock to return valid session
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    } as unknown as ReturnType<typeof useSession>)
  })

  describe('Rendering', () => {
    it('renders the prompt dialog when all dependencies are available', () => {
      render(<CreateDeliverablePrompt {...defaultProps} />)

      expect(screen.getByText(`${i18n.t('common:actions.create')} ${i18n.t('shared:assignmentTypes.text').toLocaleLowerCase()}?`)).toBeInTheDocument()
      expect(screen.getByText(i18n.t(`planning:prompts.createPrompt`, { documentLabel: i18n.t('shared:assignmentTypes.text').toLocaleLowerCase(), title: ' Test Title' }))).toBeInTheDocument()
      expect(screen.getByText(i18n.t('common:actions.create'))).toBeInTheDocument()
      expect(screen.getByText(i18n.t('common:actions.abort'))).toBeInTheDocument()
    })

    it('renders with flash deliverable type', () => {
      render(
        <CreateDeliverablePrompt
          {...defaultProps}
          deliverableType='flash'
          documentLabel={i18n.t('shared:assignmentTypes.flash')}
        />
      )

      expect(screen.getByText(`${i18n.t('common:actions.create')} ${i18n.t('shared:assignmentTypes.flash')}?`)).toBeInTheDocument()
      expect(screen.getByText(i18n.t('planning:prompts.createPrompt', { documentLabel: i18n.t('shared:assignmentTypes.flash'), title: ' Test Title' }))).toBeInTheDocument()
    })

    it('renders with editorial-info deliverable type', () => {
      render(
        <CreateDeliverablePrompt
          {...defaultProps}
          deliverableType='editorial-info'
          documentLabel={i18n.t('shared:assignmentTypes.editorial-info')}
        />
      )

      expect(screen.getByText(`${i18n.t('common:actions.create')}`)).toBeInTheDocument()
    })

    it('renders without title in description', () => {
      render(<CreateDeliverablePrompt {...defaultProps} title='' />)

      expect(screen.getByText(i18n.t(`planning:prompts.createPrompt`, { documentLabel: i18n.t('shared:assignmentTypes.text').toLocaleLowerCase(), title: '' }))).toBeInTheDocument()
    })

    it('does not render when repository is missing', () => {
      vi.mocked(useRegistry).mockReturnValueOnce({ repository: undefined } as unknown as RegistryProviderState)

      const { container } = render(<CreateDeliverablePrompt {...defaultProps} />)

      expect(container).toBeEmptyDOMElement()
    })

    it('does not render when session is missing', () => {
      vi.mocked(useSession).mockReturnValueOnce({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)

      const { container } = render(<CreateDeliverablePrompt {...defaultProps} />)

      expect(container).toBeEmptyDOMElement()
    })

    it('does not render when ydoc.provider.document is missing', () => {
      const ydocWithoutProvider: YDocument<Y.Map<unknown>> = {
        ...mockYdoc,
        provider: undefined as unknown as HocuspocusProvider
      }

      const { container } = render(
        <CreateDeliverablePrompt {...defaultProps} ydoc={ydocWithoutProvider} />
      )

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('User Interactions', () => {
    it('calls onClose with document id when primary button is clicked', async () => {
      const user = userEvent.setup()
      const mockId = 'test-uuid-123'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockId)

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.objectContaining({
            uuid: mockId
          }),
          'abc123'
        )
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith(mockId)
      })
    })

    it('calls onClose without id when secondary button is clicked', async () => {
      const user = userEvent.setup()

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const cancelButton = screen.getByText(i18n.t('common:actions.abort'))
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledWith()
      expect(mockSaveDocument).not.toHaveBeenCalled()
    })
  })

  describe('Payload Validation', () => {
    it('shows error when newsvalue is missing', async () => {
      const user = userEvent.setup()
      const payloadWithoutNewsvalue = {
        meta: {},
        links: {
          'core/section': [Block.create({ uuid: 'section-123' })]
        }
      }

      render(
        <CreateDeliverablePrompt
          {...defaultProps}
          payload={payloadWithoutNewsvalue}
        />
      )

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          i18n.t(`shared:errors.creationFailed`, { error: i18n.t('planning:toasts.missingMetadata') })
        )
      })

      expect(mockSaveDocument).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('shows error when section is missing', async () => {
      const user = userEvent.setup()
      const payloadWithoutSection = {
        meta: {
          'core/newsvalue': [Block.create({ value: '3' })]
        },
        links: {}
      }

      render(
        <CreateDeliverablePrompt
          {...defaultProps}
          payload={payloadWithoutSection}
        />
      )

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          i18n.t(`shared:errors.creationFailed`, { error: i18n.t('planning:toasts.missingMetadata') })
        )
      })

      expect(mockSaveDocument).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles saveDocument failure', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Network error'
      mockSaveDocument.mockRejectedValue(new Error(errorMessage))

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          i18n.t(`shared:errors.creationFailed`, { error: errorMessage })
        )
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('handles non-Error exceptions', async () => {
      const user = userEvent.setup()
      mockSaveDocument.mockRejectedValue('String error')

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          i18n.t(`shared:errors.creationFailed`, { error: i18n.t('common:errors.unknown') })
        )
      })
    })

    it('logs errors to console', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')
      mockSaveDocument.mockRejectedValue(error)

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to create deliverable:',
          'Test error',
          error
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Click Prevention', () => {
    it('prevents multiple simultaneous creation attempts', async () => {
      const user = userEvent.setup()
      mockSaveDocument.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))

      await user.click(createButton)
      await user.click(createButton)
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledTimes(1)
      }, { timeout: 200 })
    })

    it('allows retry after failed creation', async () => {
      const user = userEvent.setup()
      mockSaveDocument.mockRejectedValueOnce(new Error('First failure'))
      mockSaveDocument.mockResolvedValueOnce(undefined)

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))

      await user.click(createButton)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          i18n.t(`shared:errors.creationFailed`, { error: 'First failure' })
        )
      })

      await user.click(createButton)
      await waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Repository Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      process.env = { ...originalEnv, SYSTEM_LANGUAGE: 'sv-se' }
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('calls saveDocument with session access token', async () => {
      const user = userEvent.setup()

      render(<CreateDeliverablePrompt {...defaultProps} />)

      const createButton = screen.getByText(i18n.t('common:actions.create'))
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.any(Object),
          'abc123'
        )
      })
    })

    it('generates unique UUID for each document', async () => {
      const user = userEvent.setup()
      const mockId1 = 'uuid-1'
      const mockId2 = 'uuid-2'
      const uuidSpy = vi.spyOn(crypto, 'randomUUID')
      uuidSpy.mockReturnValueOnce(mockId1).mockReturnValueOnce(mockId2)

      // First creation
      const { unmount } = render(<CreateDeliverablePrompt {...defaultProps} />)
      await user.click(screen.getByText(i18n.t('common:actions.create')))

      await waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.objectContaining({ uuid: mockId1 }),
          'abc123'
        )
      })

      // Reset for second creation with fresh component
      unmount()
      mockSaveDocument.mockClear()
      mockOnClose.mockClear()

      render(<CreateDeliverablePrompt {...defaultProps} />)
      await user.click(screen.getByText(i18n.t('common:actions.create')))

      await waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.objectContaining({ uuid: mockId2 }),
          'abc123'
        )
      })

      uuidSpy.mockRestore()
    })
  })
})
