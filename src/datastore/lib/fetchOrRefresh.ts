import { type IndexedDBContextInterface } from '../contexts/IndexedDBProvider'
import type { Index } from '@/shared/Index'
import { QueryV1, RangeQueryV1, type HitV1 } from '@ttab/elephant-api/index'

/**
 * Either fetch all objects from specified object store (which is the
 * same thing as documentType - e.g core/author, core/section). If
 * necessary (or when forced) refresh the object store with data from
 * the index before returning the objects.
 */
export async function fetchOrRefresh<TObject extends { id: string }>(
  IDB: IndexedDBContextInterface,
  storeName: string,
  index: Index,
  accessToken: string,
  force: boolean,
  fields: string[],
  transformer: (hit: HitV1) => TObject
): Promise<TObject[]> {
  try {
    const { lastRefresh } = await IDB.get<{ lastRefresh: Date }>('__meta', storeName) || {}
    const maxRefreshInterval = 1000 * 3600 * 48

    if (force || !lastRefresh || (Date.now() - (lastRefresh.getTime() || 0) > maxRefreshInterval)) {
      await navigator.locks.request(`__meta_${storeName}`, { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            return
          }

          const result = await index.query({
            accessToken,
            documentType: storeName,
            size: 500,
            fields,
            query: QueryV1.create({
              conditions: {
                oneofKind: 'range',
                range: RangeQueryV1.create({
                  field: 'heads.usable.version',
                  gte: '1'
                })
              }
            }),
            options: { aggregatePages: true }
          })

          if (!result.ok || !Array.isArray(result.hits)) {
            console.warn(`[fetchOrRefresh] Index query failed for "${storeName}":`, result.errorMessage ?? 'Unknown error')
            return
          }

          const items = result.hits.map(transformer)

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
  } catch (ex: unknown) {
    console.warn(`[fetchOrRefresh] Failed for "${storeName}":`, ex instanceof Error ? ex.message : ex)
  }

  // Fetch all objects from objectStore
  const cachedObjects = await IDB.get<TObject[]>(storeName)
  return cachedObjects || []
}
