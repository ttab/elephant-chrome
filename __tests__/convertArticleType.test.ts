import { describe, it, expect, beforeEach, vi } from 'vitest'
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
      prepareArticleConversion({
        sourceDocument: doc,
        targetType: 'core/article#timeless',
        repository: mockRepository,
        accessToken: 'token'
      })
    ).rejects.toThrow('Document is already of type core/article#timeless')
  })

  it('skips prune for article → timeless (content transfers as-is + extraLinks)', async () => {
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

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article#timeless',
      repository: mockRepository,
      accessToken: 'token',
      extraLinks: [category]
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.pruneDocument).not.toHaveBeenCalled()

    expect(result.newDocument.uuid).toBe('new-uuid-12345')
    expect(result.newDocument.uri).toBe('core://article/new-uuid-12345')
    expect(result.newDocument.type).toBe('core/article#timeless')
    expect(result.newDocument.title).toBe('Test Article')
    expect(result.sourceUuid).toBe('source-uuid')

    expect(result.newDocument.links.find((l) => l.type === 'core/timeless-category'))
      .toMatchObject({ uuid: 'cat-uuid', rel: 'subject' })
    expect(result.newDocument.links.find((l) => l.rel === 'source'))
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

    expect(result.newDocument.links.find((l) => l.rel === 'source'))
      .toMatchObject({ type: 'core/article', uuid: 'timeless-uuid' })
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

    const result = await prepareArticleConversion({
      sourceDocument: sourceDoc,
      targetType: 'core/article#timeless',
      repository: mockRepository,
      accessToken: 'token'
    })

    expect(result.newDocument.links.find((l) => l.rel === 'subject')?.uuid).toBe('story-uuid')
    expect(result.newDocument.links.find((l) => l.rel === 'source')?.uuid).toBe('source-uuid')
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
    expect(result.links).toHaveLength(2)
  })
})
