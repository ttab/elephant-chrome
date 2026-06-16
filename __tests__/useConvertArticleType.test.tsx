import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useRegistry } from '@/hooks/useRegistry'
import { snapshotDocument } from '@/lib/snapshotDocument'
import {
  attachArticleAssignment,
  buildFallbackPlanning,
  deriveNewPlanning,
  prepareArticleConversion
} from '@/shared/convertArticleType'
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
    prepareArticleConversion: vi.fn(),
    deriveNewPlanning: vi.fn(),
    buildFallbackPlanning: vi.fn(),
    attachArticleAssignment: vi.fn()
  }
})

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
const mockDeriveNewPlanning = vi.mocked(deriveNewPlanning)
const mockBuildFallbackPlanning = vi.mocked(buildFallbackPlanning)
const mockAttachArticleAssignment = vi.mocked(attachArticleAssignment)
const mockSnapshotDocument = vi.mocked(snapshotDocument)

const TIMELESS_ID = '11111111-1111-1111-8111-111111111111'
const ARTICLE_ID = '22222222-2222-2222-8222-222222222222'
const PLANNING_ID = '33333333-3333-3333-8333-333333333333'
const NEW_ARTICLE_UUID = '44444444-4444-4444-8444-444444444444'
const NEW_PLANNING_UUID = '55555555-5555-5555-8555-555555555555'

function planningReferencing(articleId: string, assignmentMeta: unknown[] = []) {
  return {
    uuid: PLANNING_ID,
    meta: [{
      type: 'core/assignment',
      meta: assignmentMeta,
      links: [{ type: 'core/article', rel: 'deliverable', uuid: articleId }]
    }]
  }
}

type GetDocumentMock = ReturnType<typeof vi.fn<(args: { uuid: string }) => Promise<{ document: unknown } | undefined>>>

function primeRegistryWithRepository(repositoryOverrides?: Record<string, unknown>): {
  getDocument: GetDocumentMock
  createDerivedDocument: ReturnType<typeof vi.fn>
  getDeliverableInfo: ReturnType<typeof vi.fn>
} {
  const getDocument: GetDocumentMock = vi.fn()
  const createDerivedDocument = vi.fn().mockResolvedValue(undefined)
  const getDeliverableInfo = vi.fn().mockResolvedValue(null)
  mockUseRegistry.mockReturnValue({
    repository: { getDocument, createDerivedDocument, getDeliverableInfo, ...repositoryOverrides }
  } as never)
  return { getDocument, createDerivedDocument, getDeliverableInfo }
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
    mockDeriveNewPlanning.mockReturnValue({ uuid: NEW_PLANNING_UUID } as never)
    mockBuildFallbackPlanning.mockReturnValue({ uuid: NEW_PLANNING_UUID } as never)
    mockAttachArticleAssignment.mockImplementation((args) => ({
      ...(args.planning as object),
      uuid: NEW_PLANNING_UUID
    }) as never)
  })

  it('returns {success:false} when unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as never)
    const { createDerivedDocument } = primeRegistryWithRepository()

    const { result } = renderHook(() => useConvertArticleType())

    const outcome = await result.current.convert(TIMELESS_ID, {
      targetType: 'core/article',
      targetDate: '2026-05-15',
      sourcePlanningId: PLANNING_ID
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith('Kan inte konvertera: inte inloggad')
    expect(createDerivedDocument).not.toHaveBeenCalled()
    expect(result.current.isConverting).toBe(false)
  })

  it('builds a fresh planning from the timeless when sourcePlanningId is missing', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({
      document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'Solo' }
    })

    const { result } = renderHook(() => useConvertArticleType())

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15'
      })
    })

    expect(outcome).toEqual({
      success: true,
      kind: 'article',
      newDocumentId: NEW_ARTICLE_UUID,
      newPlanningId: NEW_PLANNING_UUID
    })
    // Only the timeless was fetched — no planning lookup.
    expect(getDocument).toHaveBeenCalledTimes(1)
    expect(mockBuildFallbackPlanning).toHaveBeenCalledTimes(1)
    expect(mockDeriveNewPlanning).not.toHaveBeenCalled()
    expect(createDerivedDocument).toHaveBeenCalledWith(expect.objectContaining<{
      newPlanning: unknown
    }>({
      newPlanning: expect.objectContaining<{ uuid: string }>({ uuid: NEW_PLANNING_UUID })
    }))
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
        sourcePlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('rejects when source is not a timeless article', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValueOnce({
      document: { uuid: TIMELESS_ID, type: 'core/article' }
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

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('source is not a timeless article')
    )
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('rejects when source planning is not found', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockImplementation(({ uuid }: { uuid: string }) => {
      if (uuid === TIMELESS_ID) {
        return Promise.resolve({
          document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'T' }
        })
      }
      return Promise.resolve(undefined)
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

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('source planning not found')
    )
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('rejects when source planning does not reference the timeless article', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockImplementation(({ uuid }: { uuid: string }) => {
      if (uuid === TIMELESS_ID) {
        return Promise.resolve({
          document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'T' }
        })
      }
      return Promise.resolve({
        document: planningReferencing('some-other-uuid')
      })
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

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('does not reference')
    )
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('atomically creates article + planning + marks source used on happy path', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockImplementation(({ uuid }: { uuid: string }) => {
      if (uuid === TIMELESS_ID) {
        return Promise.resolve({
          document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'Original' }
        })
      }
      return Promise.resolve({ document: planningReferencing(TIMELESS_ID) })
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
      newDocumentId: NEW_ARTICLE_UUID,
      newPlanningId: NEW_PLANNING_UUID
    })
    expect(createDerivedDocument).toHaveBeenCalledTimes(1)
    expect(createDerivedDocument).toHaveBeenCalledWith(expect.objectContaining<{
      newDocument: unknown
      newPlanning: unknown
      sourceStatusUpdate: unknown
    }>({
      newDocument: expect.objectContaining<{ uuid: string }>({ uuid: NEW_ARTICLE_UUID }),
      newPlanning: expect.objectContaining<{ uuid: string }>({ uuid: NEW_PLANNING_UUID }),
      sourceStatusUpdate: expect.objectContaining<{ uuid: string, name: string }>({
        uuid: TIMELESS_ID,
        name: 'used'
      })
    }))
    expect(toast.success).toHaveBeenCalledWith(
      'Artikel planerad',
      expect.objectContaining<{ action: unknown }>({ action: expect.anything() })
    )
  })

  it('flushes the timeless and source planning before reading them', async () => {
    const { getDocument } = primeRegistryWithRepository()
    getDocument.mockImplementation(({ uuid }: { uuid: string }) => {
      if (uuid === TIMELESS_ID) {
        return Promise.resolve({
          document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'T' }
        })
      }
      return Promise.resolve({ document: planningReferencing(TIMELESS_ID) })
    })

    const fakeDoc = {} as Parameters<typeof snapshotDocument>[2]

    const { result } = renderHook(() => useConvertArticleType())
    await act(async () => {
      await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        sourcePlanningId: PLANNING_ID,
        sourceDocument: fakeDoc
      })
    })

    expect(mockSnapshotDocument).toHaveBeenCalledWith(TIMELESS_ID, undefined, fakeDoc)
    expect(mockSnapshotDocument).toHaveBeenCalledWith(PLANNING_ID)
  })

  it('aborts conversion when a pre-read snapshot fails', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({
      document: { uuid: TIMELESS_ID, type: 'core/article#timeless' }
    })
    mockSnapshotDocument.mockRejectedValueOnce(new Error('snapshot down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useConvertArticleType())
    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        sourcePlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('snapshot down'))
    expect(createDerivedDocument).not.toHaveBeenCalled()
  })

  it('copies the source assignment internal description onto the new planning', async () => {
    const { getDocument } = primeRegistryWithRepository()
    getDocument.mockImplementation(({ uuid }: { uuid: string }) => {
      if (uuid === TIMELESS_ID) {
        return Promise.resolve({
          document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'T' }
        })
      }
      return Promise.resolve({
        document: planningReferencing(TIMELESS_ID, [
          { type: 'core/description', role: 'internal', data: { text: 'Carry me over' } },
          { type: 'core/description', role: 'public', data: { text: 'Public' } }
        ])
      })
    })

    const { result } = renderHook(() => useConvertArticleType())

    await act(async () => {
      await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        sourcePlanningId: PLANNING_ID
      })
    })

    expect(mockAttachArticleAssignment).toHaveBeenCalledWith(
      expect.objectContaining<{ sourceAssignment: unknown }>({
        sourceAssignment: expect.objectContaining<{ type: string }>({ type: 'core/assignment' })
      })
    )
  })

  it('surfaces createDerivedDocument rejection via toast and resets isConverting', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockImplementation(({ uuid }: { uuid: string }) => {
      if (uuid === TIMELESS_ID) {
        return Promise.resolve({
          document: { uuid: TIMELESS_ID, type: 'core/article#timeless', title: 'T' }
        })
      }
      return Promise.resolve({ document: planningReferencing(TIMELESS_ID) })
    })
    createDerivedDocument.mockRejectedValueOnce(new Error('bulkUpdate down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useConvertArticleType())

    let outcome!: Awaited<ReturnType<typeof result.current.convert>>
    await act(async () => {
      outcome = await result.current.convert(TIMELESS_ID, {
        targetType: 'core/article',
        targetDate: '2026-05-15',
        sourcePlanningId: PLANNING_ID
      })
    })

    expect(outcome).toEqual({ success: false })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('bulkUpdate down')
    )
    await waitFor(() => {
      expect(result.current.isConverting).toBe(false)
    })
  })

  it('handles the timeless direction via repository.createDerivedDocument', async () => {
    const { getDocument, createDerivedDocument } = primeRegistryWithRepository()
    getDocument.mockResolvedValue({
      document: { uuid: ARTICLE_ID, type: 'core/article' }
    })
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

    expect(outcome).toEqual({
      success: true,
      kind: 'timeless',
      newDocumentId: 'new-uuid'
    })
    const [[call]] = createDerivedDocument.mock.calls
    expect(call).toMatchObject<{ newDocument: { uuid: string } }>({
      newDocument: { uuid: 'new-uuid' }
    })
    // article → timeless must NOT mark the source — core/article has no "used" status.
    expect(call).not.toHaveProperty('sourceStatusUpdate')
    expect(toast.success).toHaveBeenCalledWith(
      'Tidlös sparad',
      expect.objectContaining<{ action: unknown }>({ action: expect.anything() })
    )
  })
})
