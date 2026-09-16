import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import {
  prepareArticleConversion
} from '@/shared/convertArticleType'
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
      prepareArticleConversion({
        sourceDocument: doc,
        targetType: 'core/article#timeless',
        repository: mockRepository,
        accessToken: 'token'
      })
    ).rejects.toThrow('Document is already of type core/article#timeless')
  })

  it('prunes for article → timeless and keeps the category link', async () => {
    const sourceDoc = Document.create({
      uuid: 'source-uuid',
      type: 'core/article',
      uri: 'core://article/source-uuid',
      language: 'sv-se',
      title: 'Test Article',
      links: []
    })

    const category = Block.create({
      type: 'core/timeless-category',
      rel: 'subject',
      uuid: 'cat-uuid',
      title: 'Culture'
    })

    // Simulate prune passing through the pre-supplied category link unchanged.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockImplementation((doc) =>
      Promise.resolve({ document: doc, errors: [] })
    )

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article#timeless',
      repository: mockRepository,
      accessToken: 'token',
      extraLinks: [category]
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).toHaveBeenCalledWith(
      expect.objectContaining<{ type: string }>({ type: 'core/article#timeless' }),
      'token'
    )

    expect(result.newDocument.uuid).toBe('new-uuid-12345')
    expect(result.newDocument.uri).toBe('core://article/new-uuid-12345')
    expect(result.newDocument.type).toBe('core/article#timeless')
    expect(result.newDocument.title).toBe('Test Article')
    expect(result.sourceUuid).toBe('source-uuid')
    expect(result.errors).toEqual([])

    expect(result.newDocument.links.find((l) => l.type === 'core/timeless-category'))
      .toMatchObject({ uuid: 'cat-uuid', rel: 'subject' })
    expect(result.newDocument.links.find((l) => l.rel === 'source-document'))
      .toMatchObject({ type: 'core/article', uuid: 'source-uuid' })
  })

  it('prunes for timeless → article (strips timeless-only fields)', async () => {
    const sourceDoc = Document.create({
      uuid: 'timeless-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/timeless-uuid',
      language: 'sv-se',
      title: 'Timeless Article',
      links: [
        Block.create({
          type: 'core/timeless-category',
          rel: 'subject',
          uuid: 'cat-uuid',
          title: 'Culture'
        })
      ]
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

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article',
      repository: mockRepository,
      accessToken: 'token'
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).toHaveBeenCalledWith(
      expect.objectContaining<{ type: string }>({ type: 'core/article' }),
      'token'
    )

    expect(result.newDocument.uuid).toBe('new-uuid-12345')
    expect(result.newDocument.type).toBe('core/article')
    expect(result.sourceUuid).toBe('timeless-uuid')

    expect(result.newDocument.links.find((l) => l.rel === 'source-document'))
      .toMatchObject({ type: 'core/article#timeless', uuid: 'timeless-uuid' })
    expect(result.errors).toEqual([])
  })

  it('preserves existing links and adds source link (article → timeless)', async () => {
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockImplementation((doc) =>
      Promise.resolve({ document: doc, errors: [] })
    )

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article#timeless',
      repository: mockRepository,
      accessToken: 'token'
    })

    expect(result.newDocument.links.find((l) => l.rel === 'subject')?.uuid).toBe('story-uuid')
    expect(result.newDocument.links.find((l) => l.rel === 'source-document')?.uuid).toBe('source-uuid')
  })

  it('strips empty slugline blocks from the pruned document meta', async () => {
    const sourceDoc = Document.create({
      uuid: 'timeless-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/timeless-uuid',
      language: 'sv-se',
      title: 'Timeless',
      meta: [
        Block.create({ type: 'tt/slugline', value: '' }),
        Block.create({ type: 'core/newsvalue', value: '3' })
      ],
      links: []
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockImplementation((doc) =>
      Promise.resolve({ document: doc, errors: [] })
    )

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article',
      repository: mockRepository,
      accessToken: 'token'
    })

    expect(result.newDocument.meta.find((b) => b.type === 'tt/slugline')).toBeUndefined()
    expect(result.newDocument.meta.find((b) => b.type === 'core/newsvalue')?.value).toBe('3')
  })

  it('keeps non-empty slugline blocks in the pruned document meta', async () => {
    const sourceDoc = Document.create({
      uuid: 'timeless-uuid',
      type: 'core/article#timeless',
      uri: 'core://article/timeless-uuid',
      language: 'sv-se',
      title: 'Timeless',
      meta: [Block.create({ type: 'tt/slugline', value: 'kept' })],
      links: []
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockRepository.pruneDocument).mockImplementation((doc) =>
      Promise.resolve({ document: doc, errors: [] })
    )

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article',
      repository: mockRepository,
      accessToken: 'token'
    })

    expect(result.newDocument.meta.find((b) => b.type === 'tt/slugline')?.value).toBe('kept')
  })
})

