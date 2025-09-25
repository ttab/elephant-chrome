import type { IDBAuthor } from 'src/datastore/types'

/**
 * Retrieve an author from IndexedDb by sub
 */
export function getAuthorBySub(authors: IDBAuthor[], sub?: string) {
  if (typeof sub !== 'string') {
    return undefined
  }

  const id = sub?.slice(sub?.lastIndexOf('/') + 1)

  return (id)
    ? authors?.find((author) => author?.sub?.includes(id))
    : undefined
}
