import type { Mock } from 'vitest'
import { vi } from 'vitest'
import { initializeAuthor } from '../src/components/Init/lib/actions/author'
import { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { toast } from 'sonner'
import type { Session } from 'next-auth'
import { generateAuthorUUID } from '@/shared/userUri'
import i18n from 'i18next'

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
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJmYW1pbHlfbmFtZSI6IkRvZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      refreshToken: 'mockRefreshToken',
      accessTokenExpires: 1234567890,
      expires: 'mockExpires',
      status: 'authenticated',
      units: [],
      org: '',
      error: '',
      user: {
        sub: 'core://user/5558',
        email: 'mock@example.com',
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
      ok: true,
      hits: [{
        document: {
          links: [{
            rel: 'same-as',
            type: 'tt/keycloak',
            uri: 'core://user/5558',
            role: 'prod'
          }]
        }
      }]
    })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    expect(result).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('should create a new author document if none exists', async () => {
    setupMocks({ ok: true, hits: [] }, { status: { code: 'OK' } })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    const expectedUuid = generateAuthorUUID('core://user/5558')

    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: expectedUuid,
        uri: `core://author/${expectedUuid}`
      }),
      mockSession.accessToken,
      expect.any(String)
    )
    expect(toast.success).toHaveBeenCalledWith('Författardokument har sparats')
  })

  it('should update an existing author document when isValid === false', async () => {
    const mockDocument = {
      links: [{
        rel: 'same-as',
        type: 'tt/keycloak',
        uri: 'core://user/5558',
        role: 'stage'
      }]
    }
    setupMocks({ ok: true, hits: [{ document: mockDocument }] }, { status: { code: 'OK' } })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
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
      expect.any(String)
    )
    expect(toast.success).toHaveBeenCalledWith('Författardokument har uppdaterats')
  })

  it('should update when user sub changes (consultant to employee)', async () => {
    const mockDocument = {
      links: [{
        rel: 'same-as',
        type: 'tt/keycloak',
        uri: 'core://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1',
        role: 'prod'
      }]
    }
    setupMocks(
      { ok: true, hits: [{ document: mockDocument }] },
      { status: { code: 'OK' } }
    )

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        links: expect.arrayContaining([
          expect.objectContaining({
            type: 'tt/keycloak',
            uri: 'core://user/5558'
          })
        ])
      }),
      mockSession.accessToken,
      expect.any(String)
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Författardokument har uppdaterats'
    )
  })

  it('should update when same-as link uses old /sub/ format', async () => {
    const mockDocument = {
      links: [{
        rel: 'same-as',
        type: 'tt/keycloak',
        uri: 'core://user/sub/5558',
        role: 'prod'
      }]
    }
    setupMocks(
      { ok: true, hits: [{ document: mockDocument }] },
      { status: { code: 'OK' } }
    )

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        links: expect.arrayContaining([
          expect.objectContaining({
            type: 'tt/keycloak',
            uri: 'core://user/5558'
          })
        ])
      }),
      mockSession.accessToken,
      expect.any(String)
    )
  })

  it('should remove old tt/keycloak same-as link when updating', async () => {
    const mockDocument = {
      links: [
        {
          rel: 'same-as',
          type: 'tt/keycloak',
          uri: 'core://user/sub/5558',
          role: 'prod'
        },
        {
          rel: 'source',
          type: 'core/content-source',
          uri: 'tt://content-source/tt',
          title: 'TT'
        }
      ]
    }
    setupMocks(
      { ok: true, hits: [{ document: mockDocument }] },
      { status: { code: 'OK' } }
    )

    await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    const savedDoc = (mockRepository.saveDocument as Mock)
      .mock.calls[0][0] as { links: Array<Record<string, string>> }
    const keycloakLinks = savedDoc.links.filter(
      (l) => l.rel === 'same-as' && l.type === 'tt/keycloak'
    )

    expect(keycloakLinks).toHaveLength(1)
    expect(keycloakLinks[0].uri).toBe('core://user/5558')

    // Non-keycloak links should be preserved
    expect(savedDoc.links.some(
      (l) => l.type === 'core/content-source'
    )).toBe(true)
  })

  it('should create author document for keycloak://user sub', async () => {
    mockSession.user.sub = 'keycloak://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1'
    setupMocks({ ok: true, hits: [] }, { status: { code: 'OK' } })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    const expectedUuid = generateAuthorUUID('keycloak://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1')

    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: expectedUuid,
        uri: `core://author/${expectedUuid}`
      }),
      mockSession.accessToken,
      expect.any(String)
    )

    // Stored link should preserve keycloak://user/ scheme
    const savedDoc = (mockRepository.saveDocument as Mock)
      .mock.calls[0][0] as { links: Array<Record<string, string>> }
    const keycloakLinks = savedDoc.links.filter(
      (l) => l.rel === 'same-as' && l.type === 'tt/keycloak'
    )
    expect(keycloakLinks[0].uri).toBe('keycloak://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1')
  })

  it('should find and validate existing author doc for keycloak://user sub', async () => {
    mockSession.user.sub = 'keycloak://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1'
    setupMocks({
      ok: true,
      hits: [{
        document: {
          links: [{
            rel: 'same-as',
            type: 'tt/keycloak',
            uri: 'keycloak://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1',
            role: 'prod'
          }]
        }
      }]
    })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    expect(result).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('should throw an error if saving the document fails', async () => {
    setupMocks({ ok: true, hits: [] }, { status: { code: 'ERROR' } })

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository,
        t: i18n.t
      })
    ).rejects.toThrow('Failed to initialize author: Failed to create author doc')

    expect(toast.error).toHaveBeenCalledWith('Kunde inte spara författardokument: Failed to create author doc')
  })

  it('should throw an error if multiple author documents are found', async () => {
    setupMocks({ ok: true, hits: [{}, {}] })

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository,
        t: i18n.t
      })
    ).rejects.toThrow('More than one author document found')

    expect(toast.error).toHaveBeenCalledWith('Flera författardokument hittades, kontakta support')
  })


  it('should throw when sub is a bare UUID without scheme prefix', async () => {
    mockSession.user.sub = '71f93d76-db76-4e26-b779-14d8c601e4ae'

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository,
        t: i18n.t
      })
    ).rejects.toThrow('Invalid user URI')

    expect(toast.error).toHaveBeenCalled()
  })

  it('should throw when token lacks given_name or family_name', async () => {
    // JWT without given_name/family_name
    mockSession.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    setupMocks({ ok: true, hits: [] }, { status: { code: 'OK' } })

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository,
        t: i18n.t
      })
    ).rejects.toThrow('missing given_name or family_name')

    expect(toast.error).toHaveBeenCalled()
  })

  it('should omit contact-info block when session has no email', async () => {
    mockSession.user.email = undefined as unknown as string
    setupMocks({ ok: true, hits: [] }, { status: { code: 'OK' } })

    const result = await initializeAuthor({
      url: mockUrl,
      session: mockSession,
      repository: mockRepository,
      t: i18n.t
    })

    expect(result).toBe(true)

    const savedDoc = (mockRepository.saveDocument as Mock).mock.calls[0][0] as {
      meta: Array<{ type: string, data: Record<string, unknown> }>
    }
    const contactInfo = savedDoc.meta.find((m) => m.type === 'core/contact-info')
    expect(contactInfo).toBeUndefined()
  })

  it('should throw an error when query for authordocs fails', async () => {
    setupMocks({ ok: false, hits: [{}, {}] })

    await expect(
      initializeAuthor({
        url: mockUrl,
        session: mockSession,
        repository: mockRepository,
        t: i18n.t
      })
    ).rejects.toThrow('Failed to initialize author: Failed to fetch author document: undefined')

    expect(toast.error).toHaveBeenCalledWith('Kunde inte spara författardokument: Failed to fetch author document: undefined')
  })
})
