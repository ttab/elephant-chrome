import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import {
  deriveNewPlanning,
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

    // Link back to source (always typed as core/article because the schema
    // only allows that type for rel=source on article documents)
    const sourceLink = result.newDocument.links.find(
      (link) => link.rel === 'source' && link.uuid === 'timeless-uuid'
    )
    expect(sourceLink).toBeDefined()
    expect(sourceLink?.type).toBe('core/article')
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

describe('deriveNewPlanning', () => {
  const makeSourcePlanning = (overrides?: Partial<Parameters<typeof Document.create>[0]>) =>
    Document.create({
      uuid: 'source-planning-uuid',
      type: 'core/planning-item',
      uri: 'core://newscoverage/source-planning-uuid',
      language: 'sv-se',
      title: 'Monday coverage',
      meta: [
        Block.create({
          type: 'core/planning-item',
          data: { start_date: '2026-04-01', end_date: '2026-04-01', tentative: 'false' }
        }),
        Block.create({ type: 'core/newsvalue', value: '3' }),
        Block.create({ type: 'tt/slugline', value: 'weather-feature' }),
        Block.create({
          type: 'core/description',
          role: 'public',
          data: { text: 'Public note' }
        }),
        Block.create({
          type: 'core/description',
          role: 'internal',
          data: { text: 'Internal note' }
        }),
        Block.create({
          type: 'core/assignment',
          id: 'old-assignment-1',
          data: { start_date: '2026-04-01' },
          links: [
            Block.create({
              type: 'core/article',
              uuid: 'old-deliverable-uuid',
              rel: 'deliverable'
            })
          ]
        }),
        Block.create({ type: 'core/assignment', id: 'old-assignment-2' })
      ],
      links: [
        Block.create({
          type: 'core/section',
          uuid: 'section-uuid',
          rel: 'section',
          title: 'Nyheter'
        }),
        Block.create({ type: 'core/story', uuid: 'story-uuid', rel: 'story' })
      ],
      ...overrides
    })

  it('returns document with fresh UUID and matching uri', () => {
    const source = makeSourcePlanning()

    const result = deriveNewPlanning({
      sourcePlanning: source,
      targetDate: '2026-05-15',
      newUuid: 'fresh-planning-uuid'
    })

    expect(result.uuid).toBe('fresh-planning-uuid')
    expect(result.uri).toBe('core://newscoverage/fresh-planning-uuid')
    expect(result.type).toBe('core/planning-item')
  })

  it('rewrites start_date and end_date on the core/planning-item meta block', () => {
    const source = makeSourcePlanning()

    const result = deriveNewPlanning({
      sourcePlanning: source,
      targetDate: '2026-05-15',
      newUuid: 'fresh-planning-uuid'
    })

    const planningItem = result.meta.find((b) => b.type === 'core/planning-item')
    expect(planningItem?.data.start_date).toBe('2026-05-15')
    expect(planningItem?.data.end_date).toBe('2026-05-15')
    expect(planningItem?.data.tentative).toBe('false')
  })

  it('filters out all core/assignment meta blocks', () => {
    const source = makeSourcePlanning()

    const result = deriveNewPlanning({
      sourcePlanning: source,
      targetDate: '2026-05-15',
      newUuid: 'fresh-planning-uuid'
    })

    expect(result.meta.find((b) => b.type === 'core/assignment')).toBeUndefined()
  })

  it('preserves other meta blocks (newsvalue, slugline, descriptions)', () => {
    const source = makeSourcePlanning()

    const result = deriveNewPlanning({
      sourcePlanning: source,
      targetDate: '2026-05-15',
      newUuid: 'fresh-planning-uuid'
    })

    expect(result.meta.find((b) => b.type === 'core/newsvalue')?.value).toBe('3')
    expect(result.meta.find((b) => b.type === 'tt/slugline')?.value).toBe('weather-feature')
    const descriptions = result.meta.filter((b) => b.type === 'core/description')
    expect(descriptions).toHaveLength(2)
    expect(descriptions.find((d) => d.role === 'public')?.data.text).toBe('Public note')
    expect(descriptions.find((d) => d.role === 'internal')?.data.text).toBe('Internal note')
  })

  it('preserves existing links (section, story) without adding back-link', () => {
    const source = makeSourcePlanning()

    const result = deriveNewPlanning({
      sourcePlanning: source,
      targetDate: '2026-05-15',
      newUuid: 'fresh-planning-uuid'
    })

    expect(result.links.find((l) => l.rel === 'section')?.uuid).toBe('section-uuid')
    expect(result.links.find((l) => l.rel === 'story')?.uuid).toBe('story-uuid')
    // Schema has no allowed rel for a back-link to the source planning.
    expect(result.links).toHaveLength(2)
  })
})

