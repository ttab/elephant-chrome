import type { HitV1 } from '@ttab/elephant-api/index'

export type SyncState = 'unknown' | 'inSync' | 'outOfSync'

const VERSION_FIELD = 'document.content.core_factbox.data.original_version'

export function getSyncStateByArticle(
  articles: HitV1[] | undefined,
  currentVersion: string | undefined
): Map<string, SyncState> {
  const result = new Map<string, SyncState>()
  if (!articles || !currentVersion) {
    return result
  }

  for (const article of articles) {
    if (!article.id) continue

    const versions = article.fields[VERSION_FIELD]?.values ?? []
    if (!versions.length) {
      result.set(article.id, 'unknown')
      continue
    }

    result.set(article.id, versions.includes(currentVersion) ? 'inSync' : 'outOfSync')
  }

  return result
}
