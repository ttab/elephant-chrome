import { type IndexedDBContextType } from '../contexts/IndexedDBProvider'
import { get } from '@/lib/index/get'

/**
 * Either fetch all objects from specified object store (which is the
 * same thing as documentType - e.g core/author, core/section). If
 * necessary (or when forced) refresh the object store with data from
 * the index before returnin the objects.
 */
export async function fetchOrRefresh<TObject, TIndexItem>(
  IDB: IndexedDBContextType,
  storeName: string,
  indexUrl: URL,
  accessToken: string,
  force: boolean,
  transformer: (item: TIndexItem) => TObject
): Promise<TObject[]> {
  const { lastRefresh } = await IDB.get<{ lastRefresh: Date }>('__meta', storeName) || {}
  const maxRefreshInterval = 1000 * 3600 * 48

  if (force || !lastRefresh || (Date.now() - (lastRefresh.getTime() || 0) > maxRefreshInterval)) {
    await navigator.locks.request(`__meta_${storeName}`, { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          return
        }

        const items = await fetchFromIndex(indexUrl, accessToken, storeName, transformer)
        if (!Array.isArray(items)) {
          return []
        }

        await IDB.clear(storeName)

        for (const item of items) {
          await IDB.put(storeName, item)
        }

        // Store refresh time in meta object store
        await IDB.put<unknown>('__meta', {
          id: storeName,
          lastRefresh: new Date()
        })
      }
    )
  }

  // Actually fetch all authors from objectStore
  const cachedAuthors = await IDB.get<TObject[]>(storeName)
  return cachedAuthors || []
}


/**
 * Fetch all items of specified documentType from index, use supplied
 * transformer to transform each item from indexed datastructure to
 * simplified object structure which is later stored in object store.
 */
export async function fetchFromIndex<TObject, TIndexItem>(
  indexUrl: URL,
  accessToken: string,
  documentType: string,
  transformer: (item: TIndexItem) => TObject
): Promise<TObject[] | undefined> {
  let page = 1
  let totalPages: number | undefined
  const objs: TObject[] = []

  try {
    do {
      const result = await get<TIndexItem>(
        new URL(indexUrl),
        accessToken,
        documentType,
        {
          page,
          size: 500
        }
      )

      if (!Array.isArray(result.hits)) {
        break
      }

      result.hits.forEach(hit => {
        objs.push(transformer(hit))
      })

      page++
      totalPages = result.pages
    } while (totalPages && page <= totalPages)
  } catch (ex) {
    console.warn(ex)
    return
  }

  return objs
}
