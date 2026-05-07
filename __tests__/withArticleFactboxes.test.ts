import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Block } from '@ttab/elephant-api/newsdoc'
import {
  BoolQueryV1,
  MultiMatchQueryV1,
  QueryV1,
  type HitV1
} from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'
import type { Index } from '@/shared/Index'

vi.mock('@/hooks/index/useDocuments/lib/fetch', () => ({
  fetch: vi.fn()
}))

import { fetch as fetchMock } from '@/hooks/index/useDocuments/lib/fetch'
import { withArticleFactboxes } from '@/hooks/index/useDocuments/lib/withArticleFactboxes'

const SUBSET_DSL = 'factbox=.content(type=\'core/factbox\')'

const session = { accessToken: 'tok' } as unknown as Session
const index = {} as Index

const makeArticleHit = (
  id: string,
  titles: string[],
  modified = '2026-05-01T00:00:00Z'
): HitV1 => ({
  id,
  fields: {
    'document.content.core_factbox.title': { values: titles },
    workflow_state: { values: ['usable'] },
    modified: { values: [modified] }
  }
} as unknown as HitV1)

const makeBlock = (overrides: Partial<{ text: string, sourceUuid: string }> = {}): Block => Block.create({
  type: 'core/factbox',
  content: [Block.create({ type: 'core/text', data: { text: overrides.text ?? '' } })],
  links: overrides.sourceUuid
    ? [Block.create({ type: 'core/factbox', uuid: overrides.sourceUuid, rel: 'source' })]
    : []
})

const makeBulkItem = (uuid: string, blocks: Block[]) => ({
  uuid,
  version: 1n,
  document: undefined,
  subset: blocks.map((block) => ({
    extractor: 0n,
    values: { factbox: { value: '', block, annotation: '', role: '' } }
  }))
})

const makeUserQuery = (term: string): QueryV1 => QueryV1.create({
  conditions: {
    oneofKind: 'bool',
    bool: BoolQueryV1.create({
      must: [{
        conditions: {
          oneofKind: 'multiMatch',
          multiMatch: MultiMatchQueryV1.create({
            fields: ['document.title', 'document.content.core_text.data.text'],
            query: term,
            type: 'phrase_prefix'
          })
        }
      }]
    })
  }
})

describe('withArticleFactboxes', () => {
  let getDocumentsMock: ReturnType<typeof vi.fn>
  let repository: Repository

  beforeEach(() => {
    vi.clearAllMocks()
    getDocumentsMock = vi.fn().mockResolvedValue({ items: [] })
    repository = { getDocuments: getDocumentsMock } as unknown as Repository
    vi.mocked(fetchMock).mockResolvedValue([])
  })

  describe('dependency guards', () => {
    it('returns hits unchanged when session is missing', async () => {
      const hits = [{ id: 'h1', fields: {} } as unknown as HitV1]
      const out = await withArticleFactboxes({ hits, session: null, index, repository })
      expect(out).toBe(hits)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(getDocumentsMock).not.toHaveBeenCalled()
    })

    it('returns hits unchanged when index is missing', async () => {
      const hits = [{ id: 'h1', fields: {} } as unknown as HitV1]
      const out = await withArticleFactboxes({ hits, session, index: undefined, repository })
      expect(out).toBe(hits)
    })

    it('returns hits unchanged when repository is missing', async () => {
      const hits = [{ id: 'h1', fields: {} } as unknown as HitV1]
      const out = await withArticleFactboxes({ hits, session, index, repository: undefined })
      expect(out).toBe(hits)
    })
  })

  describe('article-side index query', () => {
    it('always includes the workflow_state=usable term filter', async () => {
      await withArticleFactboxes({ hits: [], session, index, repository })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const call = vi.mocked(fetchMock).mock.calls[0][0]
      expect(call.documentType).toBe('core/article')
      expect(call.fields).toEqual([
        'document.content.core_factbox.title',
        'workflow_state',
        'modified'
      ])

      const conditions = call.query?.conditions
      if (conditions?.oneofKind !== 'bool') throw new Error('expected bool')

      const must = conditions.bool.must
      expect(must).toHaveLength(2)
      expect(must[0].conditions.oneofKind).toBe('exists')

      const stateClause = must[1].conditions
      if (stateClause.oneofKind !== 'term') throw new Error('expected term clause')
      expect(stateClause.term.field).toBe('workflow_state')
      expect(stateClause.term.value).toBe('usable')
    })

    it('adds a factbox-scoped multiMatch when the user query carries a term', async () => {
      await withArticleFactboxes({
        hits: [],
        session,
        index,
        repository,
        query: makeUserQuery('matkonton')
      })

      const call = vi.mocked(fetchMock).mock.calls[0][0]
      const conditions = call.query?.conditions
      if (conditions?.oneofKind !== 'bool') throw new Error('expected bool')

      expect(conditions.bool.must).toHaveLength(3)
      const third = conditions.bool.must[2].conditions
      if (third.oneofKind !== 'multiMatch') throw new Error('expected multiMatch')
      expect(third.multiMatch.query).toBe('matkonton')
      expect(third.multiMatch.fields).toEqual([
        'document.content.core_factbox.title',
        'document.content.core_factbox.content.core_text.data.text'
      ])
    })

    it('forwards the requested page to the article-side fetch', async () => {
      await withArticleFactboxes({ hits: [], session, index, repository, page: 3 })
      expect(vi.mocked(fetchMock).mock.calls[0][0].page).toBe(3)
    })
  })

  describe('row expansion from indexed multivalues', () => {
    it('produces one row per indexed factbox title, in array order', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['First', 'Second', 'Third'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a1', [
          makeBlock({ sourceUuid: 's1' }),
          makeBlock({ sourceUuid: 's2' }),
          makeBlock({ sourceUuid: 's3' })
        ])]
      })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })

      expect(out.map((r) => r.id)).toEqual([
        'a1:embedded:0',
        'a1:embedded:1',
        'a1:embedded:2'
      ])
      expect(out.map((r) => r.fields['document.title']?.values[0])).toEqual([
        'First',
        'Second',
        'Third'
      ])
      expect(out.map((r) => r.fields._document_origin_id?.values[0])).toEqual(['s1', 's2', 's3'])
    })

    it('passes the factbox subset DSL and only the page\'s articles to bulk-get', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['t1']),
        makeArticleHit('a2', ['t2'])
      ] as unknown as HitV1[])

      await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })

      expect(getDocumentsMock).toHaveBeenCalledTimes(1)
      expect(getDocumentsMock).toHaveBeenCalledWith(expect.objectContaining({
        subset: [SUBSET_DSL],
        documents: [{ uuid: 'a1' }, { uuid: 'a2' }]
      }))
    })

    it('patches body text and source uuid from the subset bulk-get by row id', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['First', 'Second'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a1', [
          makeBlock({ text: 'first body', sourceUuid: 'first-source' }),
          makeBlock({ text: 'second body', sourceUuid: 'second-source' })
        ])]
      })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })

      expect(out.map((r) => r.fields['document.content.core_text.data.text']?.values[0])).toEqual([
        'first body',
        'second body'
      ])
      expect(out.map((r) => r.fields._document_origin_id?.values[0])).toEqual([
        'first-source',
        'second-source'
      ])
    })

    it('emits rows with empty text and source uuid when the bulk-get returns nothing for an article', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['Only'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({ items: [] })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })
      expect(out).toHaveLength(1)
      expect(out[0].fields['document.title']?.values[0]).toBe('Only')
      expect(out[0].fields['document.content.core_text.data.text']?.values).toEqual([])
      expect(out[0].fields._document_origin_id?.values[0]).toBe('')
    })

    it('skips articles with no titles indexed and articles without an id', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', []),
        { id: '', fields: {} } as unknown as HitV1,
        makeArticleHit('a2', ['kept'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a2', [makeBlock({ text: 'body' })])]
      })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })
      expect(out).toHaveLength(1)
      expect(out[0].id).toBe('a2:embedded:0')
    })

    it('survives bulk-get returning fewer source links than indexed titles (multivalue alignment safety)', async () => {
      // fb2 has no source link; the per-block walk gives it '' rather than fb3's by accident.
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['fb1', 'fb2', 'fb3'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a1', [
          makeBlock({ sourceUuid: 'fb1-source' }),
          makeBlock(),
          makeBlock({ sourceUuid: 'fb3-source' })
        ])]
      })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })
      expect(out.map((r) => r.fields._document_origin_id?.values[0])).toEqual([
        'fb1-source',
        '',
        'fb3-source'
      ])
    })
  })

  describe('per-row search filtering', () => {
    it('drops sibling factboxes whose own title and text do not contain the term', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['Specific match', 'Sibling'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a1', [
          makeBlock({ text: '' }),
          makeBlock({ text: 'irrelevant body' })
        ])]
      })

      const out = await withArticleFactboxes<HitV1>({
        hits: [],
        session,
        index,
        repository,
        query: makeUserQuery('specific')
      })

      expect(out).toHaveLength(1)
      expect(out[0].fields['document.title']?.values[0]).toBe('Specific match')
    })

    it('matches against body text as well as title (case-insensitive)', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a1', ['Header'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a1', [makeBlock({ text: 'Body mentions matkonton in detail' })])]
      })

      const out = await withArticleFactboxes<HitV1>({
        hits: [],
        session,
        index,
        repository,
        query: makeUserQuery('MATKONTON')
      })

      expect(out).toHaveLength(1)
    })
  })

  describe('result shape', () => {
    it('passes standalone hits through and tags origin', async () => {
      const standalone = { id: 'fb1', fields: {} } as unknown as HitV1

      const out = await withArticleFactboxes<HitV1>({
        hits: [standalone],
        session,
        index,
        repository
      })

      expect(out).toHaveLength(1)
      expect(out[0].id).toBe('fb1')
      expect(out[0].fields._document_origin?.values).toEqual(['core/factbox'])
    })

    it('sorts merged rows by modified desc then title asc', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('older', ['Older'], '2026-04-01T00:00:00Z'),
        makeArticleHit('newer', ['Beta', 'Alpha'], '2026-05-01T00:00:00Z')
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [
          makeBulkItem('older', [makeBlock()]),
          makeBulkItem('newer', [makeBlock(), makeBlock()])
        ]
      })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })

      expect(out.map((r) => r.fields['document.title']?.values[0])).toEqual([
        'Alpha',
        'Beta',
        'Older'
      ])
    })

    it('caps merged result length, keeping the freshest items across both sources', async () => {
      const standaloneOld = {
        id: 'fb-old',
        fields: {
          'document.title': { values: ['Old standalone'] },
          modified: { values: ['2026-01-01T00:00:00Z'] }
        }
      } as unknown as HitV1
      const standaloneNew = {
        id: 'fb-new',
        fields: {
          'document.title': { values: ['New standalone'] },
          modified: { values: ['2026-05-10T00:00:00Z'] }
        }
      } as unknown as HitV1

      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('article', ['Article A', 'Article B'], '2026-05-01T00:00:00Z')
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('article', [makeBlock(), makeBlock()])]
      })

      const out = await withArticleFactboxes<HitV1>({
        hits: [standaloneOld, standaloneNew],
        session,
        index,
        repository,
        size: 2
      })

      expect(out).toHaveLength(2)
      expect(out.map((r) => r.fields['document.title']?.values[0])).toEqual([
        'New standalone',
        'Article A'
      ])
    })

    it('does not cap when cap is undefined', async () => {
      vi.mocked(fetchMock).mockResolvedValue([
        makeArticleHit('a', ['One', 'Two', 'Three'])
      ] as unknown as HitV1[])
      getDocumentsMock.mockResolvedValueOnce({
        items: [makeBulkItem('a', [makeBlock(), makeBlock(), makeBlock()])]
      })

      const out = await withArticleFactboxes<HitV1>({ hits: [], session, index, repository })

      expect(out).toHaveLength(3)
    })
  })
})
