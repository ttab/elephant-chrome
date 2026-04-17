import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useRegistry } from '@/hooks/useRegistry'
import { prepareArticleConversion } from '@/shared/convertArticleType'

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

vi.mock('@/shared/convertArticleType', () => ({
  prepareArticleConversion: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}))

const mockUseRegistry = vi.mocked(useRegistry)
const mockUseSession = vi.mocked(useSession)
const mockPrepareArticleConversion = vi.mocked(prepareArticleConversion)

const TIMELESS_ID = '11111111-1111-1111-8111-111111111111'
const ARTICLE_ID = '22222222-2222-2222-8222-222222222222'
const PLANNING_ID = '33333333-3333-3333-8333-333333333333'

function mockFetchResponse(init: {
  ok: boolean
  status: number
  body: Record<string, unknown> | null
}): void {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: init.ok,
    status: init.status,
    json: () => Promise.resolve(init.body)
  } as Response)
}

function primeRegistryWithRepository(repositoryOverrides?: Record<string, unknown>): {
  getDocument: ReturnType<typeof vi.fn>
  createDerivedDocument: ReturnType<typeof vi.fn>
} {
  const getDocument = vi.fn()
  const createDerivedDocument = vi.fn().mockResolvedValue(undefined)
  mockUseRegistry.mockReturnValue({
    repository: { getDocument, createDerivedDocument, ...repositoryOverrides }
  } as never)
  return { getDocument, createDerivedDocument }
}

describe('useConvertArticleType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { accessToken: 'abc123' },
      status: 'authenticated'
    } as never)
  })

  it('returns {success:false} without calling fetch when unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as never)
    primeRegistryWithRepository()

    const { result } = renderHook(() => useConvertArticleType())

    const outcome = await result.current.convert(TIMELESS_ID, {
      targetType: 'core/article',
      targetDate: '2026-05-15'
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith('Kan inte konvertera: inte inloggad')
    expect(global.fetch).not.toHaveBeenCalled()
    expect(result.current.isConverting).toBe(false)
  })

  it('returns {success:true,kind:"article"} on server success', async () => {
    primeRegistryWithRepository()
    mockFetchResponse({
      ok: true,
      status: 200,
      body: { articleId: ARTICLE_ID, planningId: PLANNING_ID, warnings: [] }
    })

    const { result } = renderHook(() => useConvertArticleType())

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        sourcePlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({
      success: true,
      kind: 'article',
      newDocumentId: ARTICLE_ID,
      newPlanningId: PLANNING_ID,
      warnings: []
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Tidlös artikel konverterad',
      expect.objectContaining<{ action: unknown }>({ action: expect.anything() })
    )
  })

  it('shows a warning toast when server returns source-not-marked-used', async () => {
    primeRegistryWithRepository()
    mockFetchResponse({
      ok: true,
      status: 200,
      body: {
        articleId: ARTICLE_ID,
        planningId: PLANNING_ID,
        warnings: ['source-not-marked-used']
      }
    })

    const { result } = renderHook(() => useConvertArticleType())

    await act(async () => {
      await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    // Warning is surfaced via toast.success with the "source not marked used"
    // copy; the toast payload also includes action links.
    expect(toast.success).toHaveBeenCalledWith(
      'Konverterad, men källstatusen kunde inte uppdateras',
      expect.objectContaining<{ action: unknown }>({ action: expect.anything() })
    )
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('logs the orphan articleId when server returns articleId without planningId', async () => {
    primeRegistryWithRepository()
    mockFetchResponse({
      ok: false,
      status: 500,
      body: { error: 'planning-creation-failed', articleId: ARTICLE_ID, message: 'boom' }
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useConvertArticleType())

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Orphan article created during failed conversion: ${ARTICLE_ID}`)
    )
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('planning-creation-failed')
    )
  })

  it('surfaces fetch rejection via toast and resets isConverting', async () => {
    primeRegistryWithRepository()
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('network down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useConvertArticleType())

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('network down')
    )
    await waitFor(() => {
      expect(result.current.isConverting).toBe(false)
    })
  })

  it('sets isConverting true while the request is in flight', async () => {
    primeRegistryWithRepository()
    let resolveFetch: (res: Response) => void = () => {}
    vi.mocked(global.fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve
    }))

    const { result } = renderHook(() => useConvertArticleType())

    let pending!: Promise<unknown>
    act(() => {
      pending = result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    await waitFor(() => {
      expect(result.current.isConverting).toBe(true)
    })

    resolveFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        articleId: ARTICLE_ID,
        planningId: PLANNING_ID,
        warnings: []
      })
    } as Response)
    await pending

    await waitFor(() => {
      expect(result.current.isConverting).toBe(false)
    })
  })

  it('handles the timeless direction via repository.createDerivedDocument', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({
      document: { uuid: ARTICLE_ID, type: 'core/article' }
    })
    const newDocument = { uuid: 'new-uuid', type: 'core/article#timeless' }
    mockPrepareArticleConversion.mockResolvedValue({
      newDocument,
      sourceUuid: ARTICLE_ID,
      errors: []
    } as never)

    const { result } = renderHook(() => useConvertArticleType())

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(ARTICLE_ID, {
        targetType: 'core/article#timeless'
      })
    })

    expect(outcome).toEqual({
      success: true,
      kind: 'timeless',
      newDocumentId: 'new-uuid'
    })
    expect(createDerivedDocument).toHaveBeenCalledWith(expect.objectContaining({
      newDocument,
      sourceUuid: ARTICLE_ID
    }))
    expect(toast.success).toHaveBeenCalledWith(
      'Tidlös artikel konverterad',
      expect.objectContaining<{ action: unknown }>({ action: expect.anything() })
    )
  })
})
