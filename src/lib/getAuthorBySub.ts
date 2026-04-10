import type { IDBAuthor } from 'src/datastore/types'

function extractIdFromSub(sub: string): string | undefined {
  if (!sub) return undefined

  const lastSlash = sub.lastIndexOf('/')
  if (lastSlash === -1 || lastSlash === sub.length - 1) return undefined

  return sub.slice(lastSlash + 1)
}

/**
 * Retrieve an author from IndexedDb by sub.
 * @param authorList - Array of authors to search.
 * @param sub - Optional user sub string.
 * @returns The matching author or undefined.
 */
export function getAuthorBySub(authorList: IDBAuthor[], sub?: string) {
  if (typeof sub !== 'string') return undefined

  const id = extractIdFromSub(sub)
  if (!id) return undefined

  return authorList.find((author) => extractIdFromSub(author.sub) === id)
}
