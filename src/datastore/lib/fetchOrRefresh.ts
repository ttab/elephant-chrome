import { type IndexedDBContextType } from '../contexts/IndexedDBProvider'

export async function fetchOrRefresh<T>(
  IDB: IndexedDBContextType,
  storeName: string,
  force: boolean,
  cb: () => Promise<T[]>
): Promise<T[]> {
  const { lastRefresh } = await IDB.get<{ lastRefresh: Date }>('__meta', storeName) || {}

  if (force || !lastRefresh || (Date.now() - (lastRefresh.getTime() || 0) > 60000 * 60 * 24)) {
    await navigator.locks.request(`__meta_${storeName}`, { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          return
        }

        await IDB.clear(storeName)

        const authors = await cb()
        for (const author of authors) {
          await IDB.put(storeName, author)
        }

        // Store refresh time in meta object store
        await IDB.put<unknown>('__meta', {
          id: storeName,
          lastRefresh: new Date()
        })
      }
    )
  }

  const cachedAuthors = await IDB.get<T[]>(storeName)
  return cachedAuthors || []
}
