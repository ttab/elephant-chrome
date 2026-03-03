import type { IDBAuthor } from 'src/datastore/types'
import { extractUserIdFromUri } from '@/shared/userUri'

/**
 * Retrieve an author from IndexedDb by sub.
 * @param authorList - Array of authors to search.
 * @param sub - Optional user sub string.
 * @returns The matching author or undefined.
 */
export function getAuthorBySub(
  authorList: IDBAuthor[],
  sub?: string
) {
  if (typeof sub !== 'string') return undefined

  const id = extractUserIdFromUri(sub)
  if (!id) return undefined

  return authorList.find(
    (author) => extractUserIdFromUri(author.sub) === id
  )
}
