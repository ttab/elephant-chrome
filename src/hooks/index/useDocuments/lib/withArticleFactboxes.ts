import { QueryV1, type HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import { fetch } from '@/hooks/index/useDocuments/lib/fetch'
import type { Index } from '@/shared/Index'

type withArticleFactboxFields = [
  'document.content.core_factbox.title',
  'document.content.core_factbox.content.core_text.data.text',
  'document.content.core_factbox.links.uuid',
  'workflow_state',
  'modified'
]


export const withArticleFactboxes = async <T extends HitV1>({ hits, session, index, query }: {
  hits: T[]
  session: Session | null
  index?: Index
  query?: QueryV1
}): Promise<T[]> => {
  if (!session || !index) return hits

  // Fetch all articles that have an embedded core/factbox content element
  const articles = await fetch<HitV1, withArticleFactboxFields>({
    documentType: 'core/article',
    index,
    session,
    fields: [
      'document.content.core_factbox.title',
      'document.content.core_factbox.content.core_text.data.text',
      'document.content.core_factbox.links.uuid',
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

  const existingIds = new Set(hits.map((h) => h.id))

  // Tag standalone factboxes with their origin and collect into result
  const result: T[] = hits.map((hit) => ({
    ...hit,
    fields: { ...hit.fields, _document_origin: { values: ['core/factbox'] } }
  })) as T[]

  // Build synthetic factbox hits from the embedded factbox data in each article.
  // Only include factboxes from published (usable) articles.
  // Use links.uuid as id when available so they deduplicate against standalone factboxes,
  // otherwise fall back to articleId:embedded.
  for (const article of articles) {
    if (article.fields['workflow_state']?.values[0] !== 'usable') continue

    const uuids = article.fields['document.content.core_factbox.links.uuid']?.values ?? []
    const titles = article.fields['document.content.core_factbox.title']?.values ?? []
    const texts = article.fields['document.content.core_factbox.content.core_text.data.text']?.values ?? []
    const modified = article.fields['modified']?.values ?? []

    // Build one entry per embedded factbox (index-aligned across the arrays)
    const count = Math.max(uuids.length, titles.length, 1)

    for (let i = 0; i < count; i++) {
      const id = uuids[i] ?? `${article.id}:embedded:${i}`
      if (existingIds.has(id)) continue
      if (searchFilter) {
        const title = String(titles[i] ?? '').toLowerCase()
        const text = String(texts[i] ?? '').toLowerCase()
        if (!title.includes(searchFilter) && !text.includes(searchFilter)) continue
      }

      result.push({
        id,
        score: 0,
        sort: [modified[0] ?? '', String(titles[i] ?? '').toLowerCase()],
        source: {},
        fields: {
          'document.title': { values: titles[i] ? [titles[i]] : [] },
          'document.content.core_text.data.text': { values: texts[i] ? [texts[i]] : [] },
          modified: { values: modified },
          current_version: { values: ['0'] },
          'heads.usable.version': { values: [] },
          _document_origin: { values: ['core/article'] }
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
