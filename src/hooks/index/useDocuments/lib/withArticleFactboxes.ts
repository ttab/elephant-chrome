import { QueryV1, type HitV1 } from '@ttab/elephant-api/index'
import type { BulkGetItem } from '@ttab/elephant-api/repository'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import { fetch } from '@/hooks/index/useDocuments/lib/fetch'
import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'

type withArticleFactboxFields = [
  'document.content.core_factbox.title',
  'document.content.core_factbox.content.core_text.data.text',
  'document.content.core_factbox.rel.source.uuid',
  'workflow_state',
  'modified'
]

export const withArticleFactboxes = async <T extends HitV1>({ hits, session, index, query, repository }: {
  hits: T[]
  session: Session | null
  index?: Index
  query?: QueryV1
  repository?: Repository
}): Promise<T[]> => {
  if (!session || !index || !repository) return hits

  // Fetch all articles that have an embedded core/factbox content element
  const articles = await fetch<HitV1, withArticleFactboxFields>({
    documentType: 'core/article',
    index,
    session,
    size: 1000,
    fields: [
      'document.content.core_factbox.title',
      'document.content.core_factbox.content.core_text.data.text',
      'document.content.core_factbox.rel.source.uuid',
      'workflow_state',
      'modified'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'exists',
        exists: 'document.content.core_factbox'
      }
    })
  })

  // Extract search filter from the multiMatch condition if present
  const searchFilter = (() => {
    const conditions = query?.conditions
    if (conditions?.oneofKind === 'bool') {
      for (const clause of conditions.bool.must) {
        if (clause.conditions?.oneofKind === 'multiMatch') {
          return clause.conditions.multiMatch.query.toLowerCase()
        }
      }
    }
    return null
  })()

  // Tag standalone factboxes with their origin and collect into result
  const result: T[] = hits.map((hit) => ({
    ...hit,
    fields: { ...hit.fields, _document_origin: { values: ['core/factbox'] } }
  })) as T[]

  // Only process usable articles
  const usableArticles = articles.filter((a) => a.fields['workflow_state']?.values[0] === 'usable')
  if (!usableArticles.length) return result

  // Bulk-fetch full article documents in batches of 200 (repository maximum)
  const BATCH_SIZE = 200
  const batches = []
  for (let i = 0; i < usableArticles.length; i += BATCH_SIZE) {
    batches.push(usableArticles.slice(i, i + BATCH_SIZE))
  }

  const batchResponses = await Promise.all(
    batches.map((batch) => repository.getDocuments({
      documents: batch.map((a) => ({ uuid: a.id })),
      accessToken: session.accessToken
    }))
  )

  const allItems: BulkGetItem[] = batchResponses.flatMap((response) => response?.items ?? [])

  // Build a map from article UUID to its modified timestamp for sorting
  const modifiedByArticleId = new Map(
    usableArticles.map((a) => [a.id, a.fields['modified']?.values ?? []])
  )

  for (const item of allItems) {
    if (!item.document) continue

    const articleId = item.document.uuid
    const modified = modifiedByArticleId.get(articleId) ?? []
    const factboxBlocks = item.document.content.filter((b: Block) => b.type === 'core/factbox')

    for (let i = 0; i < factboxBlocks.length; i++) {
      const block = factboxBlocks[i]
      const id = `${articleId}:embedded:${i}`

      const title = block.title ?? ''
      const text = block.content.find((b: Block) => b.type === 'core/text')?.data?.text ?? ''
      const originalFactboxId = block.links[0]?.uuid ?? ''

      if (searchFilter && !title.toLowerCase().includes(searchFilter) && !text.toLowerCase().includes(searchFilter)) {
        continue
      }

      result.push({
        id,
        score: 0,
        sort: [modified[0] ?? '', title.toLowerCase()],
        source: {},
        fields: {
          'document.title': { values: title ? [title] : [] },
          'document.content.core_text.data.text': { values: text ? [text] : [] },
          modified: { values: modified },
          current_version: { values: ['0'] },
          'heads.usable.version': { values: [] },
          _document_origin: { values: ['core/article'] },
          _document_origin_id: { values: [originalFactboxId] }
        }
      } as unknown as T)
    }
  }

  result.sort((a, b) => {
    const aModified = a.fields['modified']?.values[0] ?? ''
    const bModified = b.fields['modified']?.values[0] ?? ''
    if (bModified !== aModified) return bModified.localeCompare(aModified)

    const aTitle = a.fields['document.title']?.values[0] ?? ''
    const bTitle = b.fields['document.title']?.values[0] ?? ''
    return aTitle.localeCompare(bTitle)
  })
  return result
}
