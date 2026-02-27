import { render } from 'vitest-browser-react'

import { matchScreenshot } from '../utils/matchScreenshot'
import { CreateDeliverablePrompt } from '@/views/Planning/components/CreateDeliverablePrompt'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { TemplatePayload } from '@/shared/templates'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import {
  initialState,
  type RegistryProviderState
} from '@/contexts/RegistryProvider'

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

vi.mock('next-auth/react', async () => {
  const originalModule = await vi.importActual('next-auth/react')
  return {
    __esModule: true,
    ...originalModule,
    useSession: vi.fn()
  }
})

vi.mocked(useRegistry).mockReturnValue(initialState)

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
    documentLabel: 'artikel',
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

    vi.mocked(useRegistry).mockReturnValue({
      repository: {
        saveDocument: mockSaveDocument,
        getMeta: vi.fn(),
        getDocument: vi.fn()
      }
    } as unknown as RegistryProviderState)

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    } as unknown as ReturnType<typeof useSession>)
  })

  describe('Rendering', () => {
    it('renders the prompt dialog when all dependencies are available',
      async () => {
        const screen = await render(
          <CreateDeliverablePrompt {...defaultProps} />
        )

        await expect.element(
          screen.getByText('Skapa artikel?')
        ).toBeVisible()
        await expect.element(
          screen.getByText(
            /Vill du skapa en artikel för uppdraget Test Title/
          )
        ).toBeVisible()
        await expect.element(
          screen.getByRole('button', { name: 'Skapa' })
        ).toBeVisible()
        await expect.element(
          screen.getByRole('button', { name: 'Avbryt' })
        ).toBeVisible()
        await matchScreenshot(document.body)
      })

    it('renders with flash deliverable type', async () => {
      const screen = await render(
        <CreateDeliverablePrompt
          {...defaultProps}
          deliverableType='flash'
          documentLabel='flash'
        />
      )

      await expect.element(
        screen.getByText('Skapa flash?')
      ).toBeVisible()
      await expect.element(
        screen.getByText(
          /Vill du skapa en flash för uppdraget Test Title/
        )
      ).toBeVisible()
    })

    it('renders with editorial-info deliverable type', async () => {
      const screen = await render(
        <CreateDeliverablePrompt
          {...defaultProps}
          deliverableType='editorial-info'
          documentLabel='redaktionell info'
        />
      )

      await expect.element(
        screen.getByText('Skapa redaktionell info?')
      ).toBeVisible()
    })

    it('renders without title in description', async () => {
      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} title='' />
      )

      await expect.element(
        screen.getByText(
          /Vill du skapa en artikel för uppdraget\?$/
        )
      ).toBeVisible()
    })

    it('does not render when repository is missing', async () => {
      vi.mocked(useRegistry).mockReturnValueOnce(
        { repository: undefined } as unknown as RegistryProviderState
      )

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      expect(screen.container.childElementCount).toBe(0)
    })

    it('does not render when session is missing', async () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: null,
        status: 'unauthenticated'
      } as unknown as ReturnType<typeof useSession>)

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      expect(screen.container.childElementCount).toBe(0)
    })

    it('does not render when ydoc.provider.document is missing',
      async () => {
        const ydocWithoutProvider: YDocument<Y.Map<unknown>> = {
          ...mockYdoc,
          provider: undefined as unknown as HocuspocusProvider
        }

        const screen = await render(
          <CreateDeliverablePrompt
            {...defaultProps}
            ydoc={ydocWithoutProvider}
          />
        )

        expect(screen.container.childElementCount).toBe(0)
      })
  })

  describe('User Interactions', () => {
    it('calls onClose with document id when primary button is clicked',
      async () => {
        const mockId = 'test-uuid-123'
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockId)

        const screen = await render(
          <CreateDeliverablePrompt {...defaultProps} />
        )

        await screen.getByRole('button', { name: 'Skapa' }).click()

        await vi.waitFor(() => {
          expect(mockSaveDocument).toHaveBeenCalledWith(
            expect.objectContaining({ uuid: mockId }),
            'abc123'
          )
        })

        await vi.waitFor(() => {
          expect(mockOnClose).toHaveBeenCalledWith(mockId)
        })
        await matchScreenshot(document.body)
      })

    it('calls onClose without id when cancel is clicked', async () => {
      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      await screen.getByRole('button', { name: 'Avbryt' }).click()

      expect(mockOnClose).toHaveBeenCalledWith()
      expect(mockSaveDocument).not.toHaveBeenCalled()
    })
  })

  describe('Payload Validation', () => {
    it('shows error when newsvalue is missing', async () => {
      const payloadWithoutNewsvalue = {
        meta: {},
        links: {
          'core/section': [Block.create({ uuid: 'section-123' })]
        }
      }

      const screen = await render(
        <CreateDeliverablePrompt
          {...defaultProps}
          payload={payloadWithoutNewsvalue}
        />
      )

      await screen.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Misslyckades att skapa text: Saknar nyhetsvärde eller sektion'
        )
      })

      expect(mockSaveDocument).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
      await matchScreenshot(document.body)
    })

    it('shows error when section is missing', async () => {
      const payloadWithoutSection = {
        meta: {
          'core/newsvalue': [Block.create({ value: '3' })]
        },
        links: {}
      }

      const screen = await render(
        <CreateDeliverablePrompt
          {...defaultProps}
          payload={payloadWithoutSection}
        />
      )

      await screen.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Misslyckades att skapa text: Saknar nyhetsvärde eller sektion'
        )
      })

      expect(mockSaveDocument).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
      await matchScreenshot(document.body)
    })
  })

  describe('Error Handling', () => {
    it('handles saveDocument failure', async () => {
      const errorMessage = 'Network error'
      mockSaveDocument.mockRejectedValue(new Error(errorMessage))

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      await screen.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          `Misslyckades att skapa text: ${errorMessage}`
        )
      })

      expect(mockOnClose).not.toHaveBeenCalled()
      await matchScreenshot(document.body)
    })

    it('handles non-Error exceptions', async () => {
      mockSaveDocument.mockRejectedValue('String error')

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      await screen.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Misslyckades att skapa text: Okänt fel'
        )
      })
      await matchScreenshot(document.body)
    })

    it('logs errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
        .mockImplementation(() => {})
      const error = new Error('Test error')
      mockSaveDocument.mockRejectedValue(error)

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      await screen.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to create deliverable:',
          'Test error',
          error
        )
      })

      consoleErrorSpy.mockRestore()
      await matchScreenshot(document.body)
    })
  })

  describe('Click Prevention', () => {
    it('prevents multiple simultaneous creation attempts', async () => {
      mockSaveDocument.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 100))
      )

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      const createButton = screen.getByRole('button', { name: 'Skapa' })

      await createButton.click()
      await createButton.click()
      await createButton.click()

      await vi.waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledTimes(1)
      })
      await matchScreenshot(document.body)
    })

    it('allows retry after failed creation', async () => {
      mockSaveDocument.mockRejectedValueOnce(new Error('First failure'))
      mockSaveDocument.mockResolvedValueOnce(undefined)

      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      const createButton = screen.getByRole('button', { name: 'Skapa' })

      await createButton.click()
      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Misslyckades att skapa text: First failure'
        )
      })

      await createButton.click()
      await vi.waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledTimes(2)
      })
      await matchScreenshot(document.body)
    })
  })

  describe('Repository Integration', () => {
    it('calls saveDocument with session access token', async () => {
      const screen = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )

      await screen.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.any(Object),
          'abc123'
        )
      })
      await matchScreenshot(document.body)
    })

    it('generates unique UUID for each document', async () => {
      const mockId1 = 'uuid-1'
      const mockId2 = 'uuid-2'
      const uuidSpy = vi.spyOn(crypto, 'randomUUID')
      uuidSpy.mockReturnValueOnce(mockId1).mockReturnValueOnce(mockId2)

      const screen1 = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )
      await screen1.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.objectContaining({ uuid: mockId1 }),
          'abc123'
        )
      })

      await screen1.unmount()
      mockSaveDocument.mockClear()
      mockOnClose.mockClear()

      const screen2 = await render(
        <CreateDeliverablePrompt {...defaultProps} />
      )
      await screen2.getByRole('button', { name: 'Skapa' }).click()

      await vi.waitFor(() => {
        expect(mockSaveDocument).toHaveBeenCalledWith(
          expect.objectContaining({ uuid: mockId2 }),
          'abc123'
        )
      })

      uuidSpy.mockRestore()
      await matchScreenshot(document.body)
    })
  })
})
