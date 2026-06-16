import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useRegistry } from '@/hooks/useRegistry'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { prepareArticleConversion } from '@/shared/convertArticleType'
import type * as ConvertArticleTypeModule from '@/shared/convertArticleType'

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

vi.mock('@/shared/convertArticleType', async () => {
  const actual = await vi.importActual<typeof ConvertArticleTypeModule>(
    '@/shared/convertArticleType'
  )
  return {
    ...actual,
    prepareArticleConversion: vi.fn()
  }
})

vi.mock('@/lib/index/addAssignment', () => ({
  addAssignmentWithDeliverable: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('@/lib/snapshotDocument', () => ({
  snapshotDocument: vi.fn().mockResolvedValue(undefined)
}))

const mockUseRegistry = vi.mocked(useRegistry)
const mockUseSession = vi.mocked(useSession)
const mockPrepareArticleConversion = vi.mocked(prepareArticleConversion)
const mockAddAssignment = vi.mocked(addAssignmentWithDeliverable)
const mockSnapshotDocument = vi.mocked(snapshotDocument)

const TIMELESS_ID = '11111111-1111-1111-8111-111111111111'
const ARTICLE_ID = '22222222-2222-2222-8222-222222222222'
const PLANNING_ID = '33333333-3333-3333-8333-333333333333'
const NEW_ARTICLE_UUID = '44444444-4444-4444-8444-444444444444'
const NEW_PLANNING_UUID = '55555555-5555-5555-8555-555555555555'

const SECTION_LINK = {
  type: 'core/section',
  rel: 'section',
  uuid: 'sec-uuid',
  title: 'Inrikes'
}

function timelessDoc(overrides?: Record<string, unknown>) {
  return {
    uuid: TIMELESS_ID,
    type: 'core/article#timeless',
    title: 'Original',
    meta: [
      { type: 'tt/slugline', value: 'slug-abc' },
      { type: 'core/newsvalue', value: '3' }
    ],
    links: [SECTION_LINK],
    ...overrides
  }
}

type GetDocumentResult = Promise<{ document: unknown, version?: bigint } | undefined>
type GetDocumentMock = ReturnType<
  typeof vi.fn<(args: { uuid: string }) => GetDocumentResult>
>

function primeRegistryWithRepository(repositoryOverrides?: Record<string, unknown>): {
  getDocument: GetDocumentMock
  createDerivedDocument: ReturnType<typeof vi.fn>
} {
  const getDocument: GetDocumentMock = vi.fn()
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
    mockPrepareArticleConversion.mockReturnValue({
      newDocument: { uuid: NEW_ARTICLE_UUID, type: 'core/article', links: [] },
      sourceUuid: TIMELESS_ID,
      errors: []
    } as never)
    mockAddAssignment.mockResolvedValue(NEW_PLANNING_UUID)
  })

  it('returns {success:false} when unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as never)
    const { createDerivedDocument } = primeRegistryWithRepository()

    const { result } = renderHook(() => useConvertArticleType())

    const outcome = await result.current.convert(TIMELESS_ID, {
      targetType: 'core/article',
      targetDate: '2026-05-15',
      targetPlanningId: PLANNING_ID
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith('Kan inte konvertera: inte inloggad')
    expect(createDerivedDocument).not.toHaveBeenCalled()
    expect(result.current.isConverting).toBe(false)
  })

  it('rejects when source document is not found', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('rejects when source is not a timeless article', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValueOnce({ document: { uuid: TIMELESS_ID, type: 'core/article' } })

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('source is not a timeless article')
    )
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('creates article, marks source used, assigns to chosen planning', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc(), version: 7n })

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({
      success: true,
      kind: 'article',
      newDocumentId: NEW_ARTICLE_UUID,
      newPlanningId: NEW_PLANNING_UUID
    })

    expect(createDerivedDocument).toHaveBeenCalledTimes(1)
    const [[derivedArgs]] = createDerivedDocument.mock.calls
    expect(derivedArgs).not.toHaveProperty('newPlanning')
    expect(derivedArgs).toMatchObject({
      newDocument: { uuid: NEW_ARTICLE_UUID },
      sourceStatusUpdate: { uuid: TIMELESS_ID, name: 'used', version: 7n }
    })

    expect(mockAddAssignment).toHaveBeenCalledWith(expect.objectContaining({
      planningId: PLANNING_ID,
      type: 'text',
      deliverableId: NEW_ARTICLE_UUID,
      title: 'Original',
      slugline: 'slug-abc',
      priority: 3,
      publicVisibility: true,
      localDate: '2026-05-15',
      isoDateTime: '2026-05-15T09:00:00Z',
      section: { uuid: 'sec-uuid', title: 'Inrikes' }
    }))

    expect(toast.success).toHaveBeenCalledWith(
      'Artikel planerad',
      expect.objectContaining({ action: expect.anything() })
    )
  })

  it('passes planningId undefined so the server creates a new planning', async () => {
    const { getDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc(), version: 1n })

    const { result } = renderHook(() => useConvertArticleType())
    await act(async () => {
      await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    expect(mockAddAssignment).toHaveBeenCalledWith(expect.objectContaining({
      planningId: undefined,
      section: { uuid: 'sec-uuid', title: 'Inrikes' }
    }))
  })

  it('blocks creating a new planning when the timeless has no section', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({
      document: timelessDoc({ links: [] }),
      version: 1n
    })

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(createDerivedDocument).not.toHaveBeenCalled()
    expect(mockAddAssignment).not.toHaveBeenCalled()
  })

  it('still assigns to an existing planning when the timeless has no section', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc({ links: [] }), version: 1n })

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({
      success: true,
      kind: 'article',
      newDocumentId: NEW_ARTICLE_UUID,
      newPlanningId: NEW_PLANNING_UUID
    })
    expect(createDerivedDocument).toHaveBeenCalledTimes(1)
    expect(mockAddAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ planningId: PLANNING_ID, section: undefined })
    )
  })

  it('returns failure when addAssignmentWithDeliverable fails', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc(), version: 1n })
    mockAddAssignment.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(createDerivedDocument).toHaveBeenCalledTimes(1)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('flushes the timeless before reading it', async () => {
    const { getDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc(), version: 1n })
    const fakeDoc = {} as Parameters<typeof snapshotDocument>[2]

    const { result } = renderHook(() => useConvertArticleType())
    await act(async () => {
      await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID,
        sourceDocument: fakeDoc
      })
    })

    expect(mockSnapshotDocument).toHaveBeenCalledWith(TIMELESS_ID, undefined, fakeDoc)
  })

  it('aborts conversion when the pre-read snapshot fails', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc(), version: 1n })
    mockSnapshotDocument.mockRejectedValueOnce(new Error('snapshot down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('snapshot down'))
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('surfaces createDerivedDocument rejection via toast and resets isConverting', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: timelessDoc(), version: 1n })
    createDerivedDocument.mockRejectedValueOnce(new Error('bulkUpdate down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        targetPlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('bulkUpdate down'))
    await waitFor(() => {
      expect(result.current.isConverting).toBe(false)
    })
  })

  it('handles the timeless direction via repository.createDerivedDocument', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({ document: { uuid: ARTICLE_ID, type: 'core/article' } })
    const newDocument = { uuid: 'new-uuid', type: 'core/article#timeless', links: [] }
    mockPrepareArticleConversion.mockReturnValue({
      newDocument,
      sourceUuid: ARTICLE_ID,
      errors: []
    } as never)

    const { result } = renderHook(() => useConvertArticleType())
    const category = {
      type: 'core/timeless-category',
      rel: 'subject',
      uuid: 'cat-uuid',
      title: 'Culture'
    } as never

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(ARTICLE_ID, {
        targetType: 'core/article#timeless',
        category
      })
    })

    expect(outcome).toEqual({ success: true, kind: 'timeless', newDocumentId: 'new-uuid' })
    const [[call]] = createDerivedDocument.mock.calls
    expect(call).toMatchObject({ newDocument: { uuid: 'new-uuid' } })
    expect(call).not.toHaveProperty('sourceStatusUpdate')
    expect(toast.success).toHaveBeenCalledWith(
      'Tidlös sparad',
      expect.objectContaining({ action: expect.anything() })
    )
  })
})
