import {
  BoolQueryV1,
  MultiMatchQueryV1,
  QueryV1,
  TermQueryV1,
  type HitV1
} from '@ttab/elephant-api/index'
import type { BulkGetItem } from '@ttab/elephant-api/repository'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import { fetch } from '@/hooks/index/useDocuments/lib/fetch'
import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'

const SUBSET_NAME = 'factbox'
const SUBSET_DSL = `${SUBSET_NAME}=.content(type='core/factbox')`

// Repository BulkGet caps at 200 documents per call.
const BATCH_SIZE = 200

// `title` multivalue is in content order — index `i` matches the i-th
// `core/factbox` block (same index `:embedded:N` and `consume.ts` use).
// Source uuid and body text aren't here: flattened multivalues can't be
// reassociated per factbox when a field is missing on some factboxes.
const ARTICLE_FIELDS = [
  'document.content.core_factbox.title',
  'workflow_state',
  'modified'
] as const

/** Free-text term from the standalone-factbox query, or `''`. */
const extractSearchTerm = (query: QueryV1 | undefined): string => {
  const conditions = query?.conditions
  if (conditions?.oneofKind !== 'bool') return ''
  for (const clause of conditions.bool.must) {
    if (clause.conditions?.oneofKind === 'multiMatch') {
      return clause.conditions.multiMatch.query
    }
  }
  return ''
}

/**
 * Article-side query: exists(factbox), workflow_state=usable, plus a
 * multiMatch when the user typed something. The multiMatch narrows fan-out
 * but matches at article scope (flattened multivalue), so the per-row
 * client filter below is needed to restore per-factbox precision.
 */
const buildArticleQuery = (searchTerm: string): QueryV1 => {
  const must: QueryV1[] = [
    QueryV1.create({
      conditions: { oneofKind: 'exists', exists: 'document.content.core_factbox' }
    }),
    QueryV1.create({
      conditions: {
        oneofKind: 'term',
        term: TermQueryV1.create({ field: 'workflow_state', value: 'usable' })
      }
    })
  ]

  if (searchTerm) {
    must.push(QueryV1.create({
      conditions: {
        oneofKind: 'multiMatch',
        multiMatch: MultiMatchQueryV1.create({
          fields: [
            'document.content.core_factbox.title',
            'document.content.core_factbox.content.core_text.data.text'
          ],
          query: searchTerm,
          type: 'phrase_prefix'
        })
      }
    }))
  }

  return QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({ must })
    }
  })
}

interface ArticleRowSeed {
  articleId: string
  blockIndex: number
  title: string
  modified: string[]
}

/** Title from indexed multivalue; text and source uuid from the bulk-get below. */
const expandArticleHits = (articles: HitV1[]): ArticleRowSeed[] => {
  const seeds: ArticleRowSeed[] = []

  for (const article of articles) {
    const articleId = article.id
    if (!articleId) continue

    const titles = article.fields['document.content.core_factbox.title']?.values ?? []
    const modified = article.fields['modified']?.values ?? []

    for (let i = 0; i < titles.length; i++) {
      seeds.push({
        articleId,
        blockIndex: i,
        title: titles[i] ?? '',
        modified
      })
    }
  }

  return seeds
}

interface RowBlockData {
  text: string
  sourceUuid: string
}

/** `${articleId}:embedded:${i}` → text + first-link uuid from the subset blocks. */
const fetchFactboxData = async (
  articleIds: string[],
  repository: Repository,
  accessToken: string
): Promise<Map<string, RowBlockData>> => {
  const dataByRowId = new Map<string, RowBlockData>()
  if (!articleIds.length) return dataByRowId

  const batches: string[][] = []
  for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
    batches.push(articleIds.slice(i, i + BATCH_SIZE))
  }

  const batchResponses = await Promise.all(
    batches.map((batch) => repository.getDocuments({
      documents: batch.map((uuid) => ({ uuid })),
      accessToken,
      subset: [SUBSET_DSL]
    }))
  )

  const allItems: BulkGetItem[] = batchResponses.flatMap((response) => response?.items ?? [])

  for (const item of allItems) {
    const articleId = item.uuid
    if (!articleId) continue

    // Subset entries are in `content` order — same as the indexed `title`
    // multivalue and the index `consume.ts` uses on drop.
    const blocks: Block[] = (item.subset ?? [])
      .map((entry) => entry.values?.[SUBSET_NAME]?.block)
      .filter((b): b is Block => b !== undefined)

    blocks.forEach((block, i) => {
      const text = block.content.find((b: Block) => b.type === 'core/text')?.data?.text ?? ''
      const sourceUuid = block.links[0]?.uuid ?? ''
      dataByRowId.set(`${articleId}:embedded:${i}`, { text, sourceUuid })
    })
  }

  return dataByRowId
}

export const withArticleFactboxes = async <T extends HitV1>({ hits, session, index, query, repository, page, size }: {
  hits: T[]
  session: Session | null
  index?: Index
  query?: QueryV1
  repository?: Repository
  page?: number
  /** Caller's requested page size. Drives both the article-side fetch budget
   * and the final cap after merging + sorting by `modified`. Without it the
   * article fetch falls back to a baseline and the merged result is uncapped. */
  size?: number
}): Promise<T[]> => {
  if (!session || !index || !repository) return hits

  const searchTerm = extractSearchTerm(query)
  const searchFilter = searchTerm.toLowerCase()

  // Standalone hits become the merge base, tagged with their origin.
  const result: T[] = hits.map((hit) => ({
    ...hit,
    fields: { ...hit.fields, _document_origin: { values: ['core/factbox'] } }
  })) as T[]

  // Article fetch size mirrors the caller's size so the top-N is correct even
  // in the worst case where each article contributes one factbox block. Each
  // article typically expands to several rows, so this is a safe over-fetch.
  const articles = await fetch<HitV1, typeof ARTICLE_FIELDS>({
    documentType: 'core/article',
    index,
    session,
    size: size ?? 30,
    page,
    fields: [...ARTICLE_FIELDS],
    query: buildArticleQuery(searchTerm)
  })

  if (!articles.length) return result

  const seeds = expandArticleHits(articles)
  if (!seeds.length) return result

  // Subset bulk-get for text + source uuid: the index flattens these
  // multivalues so they can't be reassociated per factbox from hits alone.
  const articleIds = articles.map((a) => a.id).filter((id): id is string => !!id)
  const dataByRowId = await fetchFactboxData(articleIds, repository, session.accessToken)

  for (const seed of seeds) {
    const id = `${seed.articleId}:embedded:${seed.blockIndex}`
    const blockData = dataByRowId.get(id) ?? { text: '', sourceUuid: '' }

    // Per-row precision: the index match is article-scope, so drop sibling
    // factboxes that don't match the term themselves.
    if (searchFilter && !seed.title.toLowerCase().includes(searchFilter) && !blockData.text.toLowerCase().includes(searchFilter)) {
      continue
    }

    result.push({
      id,
      score: 0,
      sort: [seed.modified[0] ?? '', seed.title.toLowerCase()],
      source: {},
      fields: {
        'document.title': { values: seed.title ? [seed.title] : [] },
        'document.content.core_text.data.text': { values: blockData.text ? [blockData.text] : [] },
        modified: { values: seed.modified },
        current_version: { values: ['0'] },
        'heads.usable.version': { values: [] },
        _document_origin: { values: ['core/article'] },
        _document_origin_id: { values: [blockData.sourceUuid] }
      }
    } as unknown as T)
  }

  result.sort((a, b) => {
    const aModified = a.fields['modified']?.values[0] ?? ''
    const bModified = b.fields['modified']?.values[0] ?? ''
    if (bModified !== aModified) return bModified.localeCompare(aModified)

    const aTitle = a.fields['document.title']?.values[0] ?? ''
    const bTitle = b.fields['document.title']?.values[0] ?? ''
    return aTitle.localeCompare(bTitle)
  })

  if (size !== undefined && result.length > size) {
    result.length = size
  }

  return result
}
