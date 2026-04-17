import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Document } from '@ttab/elephant-api/newsdoc'
import { prepareArticleConversion } from '@/shared/convertArticleType'
import type { Repository } from '@/shared/Repository'

describe('prepareArticleConversion', () => {
  const mockRepository = {
    pruneDocument: vi.fn()
  } as unknown as Repository

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('crypto', {
      randomUUID: () => 'new-uuid-12345'
    })
  })

  it('throws when document is already target type', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test'
    })

    await expect(
      prepareArticleConversion(doc, 'core/article#timeless', mockRepository, 'token')
    ).rejects.toThrow('Document is already of type core/article#timeless')

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).not.toHaveBeenCalled()
  })

  it('creates new document with fresh UUID when converting article to timeless', async () => {
    const sourceDoc = Document.create({
      uuid: 'source-uuid',
      type: 'core/article',
      uri: 'core://article/source-uuid',
      language: 'sv-se',
      title: 'Test Article',
      links: []
    })

    const prunedDoc = Document.create({
      uuid: 'source-uuid', // Prune returns same UUID
      type: 'core/article#timeless',
      uri: 'core://article/source-uuid',
      language: 'sv-se',
      title: 'Test Article',
      links: []
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: prunedDoc,
      errors: []
    })

    const result = await prepareArticleConversion(
      sourceDoc,
      'core/article#timeless',
      mockRepository,
      'token'
    )

    // Should have called prune with target type
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'core/article#timeless' }),
      'token'
    )

    // New document should have fresh UUID
    expect(result.newDocument.uuid).toBe('new-uuid-12345')
    expect(result.newDocument.uri).toBe('core://article/new-uuid-12345')
    expect(result.newDocument.type).toBe('core/article#timeless')

    // Should include source UUID for status update
    expect(result.sourceUuid).toBe('source-uuid')

    // Should have link back to source document
    const sourceLink = result.newDocument.links.find(
      (link) => link.rel === 'source' && link.uuid === 'source-uuid'
    )
    expect(sourceLink).toBeDefined()
    expect(sourceLink?.type).toBe('core/article')
  })

  it('creates new document when converting timeless to article', async () => {
    const sourceDoc = Document.create({
      uuid: 'timeless-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/timeless-uuid',
      language: 'sv-se',
      title: 'Timeless Article',
      links: []
    })

    const prunedDoc = Document.create({
      uuid: 'timeless-uuid',
      type: 'core/article',
      uri: 'core://article/timeless-uuid',
      language: 'sv-se',
      title: 'Timeless Article',
      links: []
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: prunedDoc,
      errors: []
    })

    const result = await prepareArticleConversion(
      sourceDoc,
      'core/article',
      mockRepository,
      'token'
    )

    expect(result.newDocument.uuid).toBe('new-uuid-12345')
    expect(result.newDocument.type).toBe('core/article')
    expect(result.sourceUuid).toBe('timeless-uuid')

    // Link back to timeless source
    const sourceLink = result.newDocument.links.find(
      (link) => link.rel === 'source' && link.uuid === 'timeless-uuid'
    )
    expect(sourceLink).toBeDefined()
    expect(sourceLink?.type).toBe('core/article#timeless')
  })

  it('preserves existing links and adds source link', async () => {
    const sourceDoc = Document.create({
      uuid: 'source-uuid',
      type: 'core/article',
      uri: 'core://article/source-uuid',
      language: 'sv-se',
      title: 'Test',
      links: [
        { type: 'core/story', uuid: 'story-uuid', rel: 'subject', uri: '', url: '', title: '' }
      ]
    })

    const prunedDoc = Document.create({
      uuid: 'source-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/source-uuid',
      language: 'sv-se',
      title: 'Test',
      links: [
        { type: 'core/story', uuid: 'story-uuid', rel: 'subject', uri: '', url: '', title: '' }
      ]
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: prunedDoc,
      errors: []
    })

    const result = await prepareArticleConversion(
      sourceDoc,
      'core/article#timeless',
      mockRepository,
      'token'
    )

    // Should have original link + source link
    expect(result.newDocument.links).toHaveLength(2)
    expect(result.newDocument.links.find((l) => l.rel === 'subject')).toBeDefined()
    expect(result.newDocument.links.find((l) => l.rel === 'source')).toBeDefined()
  })

  it('returns validation errors from prune', async () => {
    const doc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test',
      links: []
    })

    const prunedDoc = Document.create({
      uuid: 'test-uuid',
      type: 'core/article',
      uri: 'core://article/test-uuid',
      language: 'sv-se',
      title: 'Test',
      links: []
    })

    const errors = [{ entity: [], error: 'Removed invalid block' }]

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockResolvedValue({
      document: prunedDoc,
      errors
    })

    const result = await prepareArticleConversion(doc, 'core/article', mockRepository, 'token')

    expect(result.errors).toEqual(errors)
    // Errors are warnings, conversion still succeeds
    expect(result.newDocument).toBeDefined()
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
      prepareArticleConversion(doc, 'core/article#timeless', mockRepository, 'token')
    ).rejects.toThrow('Prune API returned empty document')
  })
})
