import { describe, it, expect, vi } from 'vitest'
import { Document } from '@ttab/elephant-api/newsdoc'
import { convertArticleType } from '@/shared/convertArticleType'
import type { Repository } from '@/shared/Repository'

describe('convertArticleType', () => {
  const mockRepository = {
    pruneDocument: vi.fn()
  } as unknown as Repository

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unchanged document when already target type', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    const result = await convertArticleType(doc, 'core/article#timeless', mockRepository, 'token')

    expect(result.document).toBe(doc)
    expect(result.errors).toEqual([])
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).not.toHaveBeenCalled()
  })

  it('converts article to timeless-article via prune', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    const prunedDoc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: prunedDoc,
      errors: []
    })

    const result = await convertArticleType(doc, 'core/article#timeless', mockRepository, 'token')

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'core/article#timeless' }),
      'token'
    )
    expect(result.document.type).toBe('core/article#timeless')
    expect(result.errors).toEqual([])
  })

  it('converts timeless-article to article via prune', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    const prunedDoc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: prunedDoc,
      errors: []
    })

    const result = await convertArticleType(doc, 'core/article', mockRepository, 'token')

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'core/article' }),
      'token'
    )
    expect(result.document.type).toBe('core/article')
  })

  it('returns validation errors from prune', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    const errors = [{ entity: [], error: 'Missing required field' }]

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: doc,
      errors
    })

    const result = await convertArticleType(doc, 'core/article', mockRepository, 'token')

    expect(result.errors).toEqual(errors)
  })

  it('propagates errors from pruneDocument', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockRejectedValue(
      new Error('Prune API returned empty document')
    )

    await expect(
      convertArticleType(doc, 'core/article#timeless', mockRepository, 'token')
    ).rejects.toThrow('Prune API returned empty document')
  })
})
