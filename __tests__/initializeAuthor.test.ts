import type { Mock } from 'vitest'
import { vi } from 'vitest'
import { initializeAuthor } from '../src/components/Init/lib/actions/author'
import { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { toast } from 'sonner'
import type { Session } from 'next-auth'

vi.mock('@/shared/Index')
vi.mock('@/shared/Repository')
vi.mock('sonner')

describe('initializeAuthor', () => {
  let mockSession: Session
  let mockRepository: Repository
  let mockUrl: URL

  const setupMocks = (queryResult: Record<string, unknown>, saveResult: Record<string, unknown> | null = null) => {
    (Index.prototype.query as Mock).mockResolvedValue(queryResult)
    if (saveResult) {
      (mockRepository.saveDocument as Mock).mockResolvedValue(saveResult)
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockSession = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      refreshToken: 'mockRefreshToken',
      accessTokenExpires: 1234567890,
      expires: 'mockExpires',
      status: 'authenticated',
      error: '',
      user: {
        sub: 'mockSub',
        email: 'mockEmail',
        name: 'Mock User',
        image: 'https://example.com/mock-image.jpg',
        id: 'mockId'
      }
    }

    mockRepository = {
      saveDocument: vi.fn()
    } as unknown as Repository

    mockUrl = new URL('https://mockurl.com')
  })

  it('should return true if the author document is valid', async () => {
    setupMocks({
      hits: [{ document: { links: [{ type: 'tt/keycloak', role: 'prod' }] } }]
    })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository
    })

    expect(result).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('should create a new author document if none exists', async () => {
    setupMocks({ hits: [] }, { status: { code: 'OK' } })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository
    })

    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Författardokument är skapat')
  })

  it('should update an existing author document when isValid === false', async () => {
    const mockDocument = { links: [{ type: 'tt/keycloak', role: 'stage' }] }
    setupMocks({ hits: [{ document: mockDocument }] }, { status: { code: 'OK' } })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository
    })

    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        links: expect.arrayContaining([
          expect.objectContaining({ type: 'tt/keycloak', role: 'prod' })
        ])
      }),
      mockSession.accessToken,
      expect.any(BigInt),
      expect.any(String)
    )
    expect(toast.success).toHaveBeenCalledWith('Författardokument är uppdaterat')
  })

  it('should throw an error if saving the document fails', async () => {
    setupMocks({ hits: [] }, { status: { code: 'ERROR' } })

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository
      })
    ).rejects.toThrow('Failed to initialize author: Failed to create author doc')

    expect(toast.error).toHaveBeenCalledWith('Kunde inte skapa författardokument')
  })

  it('should throw an error if multiple author documents are found', async () => {
    setupMocks({ hits: [{}, {}] })

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository
      })
    ).rejects.toThrow('More than one author document found')

    expect(toast.error).toHaveBeenCalledWith('Flera författardokument hittades, kontakta support')
  })
})
