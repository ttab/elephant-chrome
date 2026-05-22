import type { Repository } from '@/shared/Repository'
import type { Session } from 'next-auth'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const session = (accessToken: string): Session => ({ accessToken } as Session)

const getCachedSessionMock = vi.fn<() => Promise<Session | null>>()

vi.mock('@/shared/getCachedSession', () => ({
  getCachedSession: () => getCachedSessionMock()
}))

const importGetImageSrc = async () => {
  const mod = await import('@/views/PrintEditor/lib/getImageSrc')
  return mod.getImageSrc
}

describe('PrintEditor getImageSrc', () => {
  let getAttachmentDetails: ReturnType<typeof vi.fn>
  let repository: Repository

  beforeEach(() => {
    vi.clearAllMocks()
    getAttachmentDetails = vi.fn().mockResolvedValue({ downloadLink: 'https://cdn.example/signed' })
    repository = { getAttachmentDetails } as unknown as Repository
  })

  it('reads the access token at call time so rotated tokens are used', async () => {
    // First call: cache holds an "old" session.
    getCachedSessionMock.mockResolvedValueOnce(session('OLD_TOKEN'))
    // Second call (after rotation): cache holds the fresh session.
    getCachedSessionMock.mockResolvedValueOnce(session('NEW_TOKEN'))

    const getImageSrc = await importGetImageSrc()

    await getImageSrc({ uploadId: 'doc-1' }, repository)
    await getImageSrc({ uploadId: 'doc-2' }, repository)

    expect(getAttachmentDetails).toHaveBeenNthCalledWith(1, 'doc-1', 'OLD_TOKEN')
    expect(getAttachmentDetails).toHaveBeenNthCalledWith(2, 'doc-2', 'NEW_TOKEN')
  })

  it('returns the signed downloadLink for an uploaded image', async () => {
    getCachedSessionMock.mockResolvedValue(session('TOK'))
    const getImageSrc = await importGetImageSrc()

    const src = await getImageSrc({ uploadId: 'doc-1' }, repository)

    expect(src).toBe('https://cdn.example/signed')
  })

  it('falls back to properties.src when no uploadId is present (ImageSearch path)', async () => {
    const getImageSrc = await importGetImageSrc()

    const src = await getImageSrc({ src: 'https://media/example.jpg' }, repository)

    expect(src).toBe('https://media/example.jpg')
    expect(getAttachmentDetails).not.toHaveBeenCalled()
    expect(getCachedSessionMock).not.toHaveBeenCalled()
  })

  it('returns empty string when neither uploadId nor src is set', async () => {
    const getImageSrc = await importGetImageSrc()

    const src = await getImageSrc({}, repository)

    expect(src).toBe('')
    expect(getAttachmentDetails).not.toHaveBeenCalled()
  })

  it('returns empty string when the repository response has no downloadLink', async () => {
    getCachedSessionMock.mockResolvedValue(session('TOK'))
    getAttachmentDetails.mockResolvedValueOnce({})
    const getImageSrc = await importGetImageSrc()

    const src = await getImageSrc({ uploadId: 'doc-1' }, repository)

    expect(src).toBe('')
  })

  it('uses an empty bearer when there is no cached session', async () => {
    getCachedSessionMock.mockResolvedValue(null)
    const getImageSrc = await importGetImageSrc()

    await getImageSrc({ uploadId: 'doc-1' }, repository)

    expect(getAttachmentDetails).toHaveBeenCalledWith('doc-1', '')
  })
})
