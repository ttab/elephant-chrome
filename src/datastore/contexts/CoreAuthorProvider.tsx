import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBAuthor } from '../types'

interface CoreAuthorProviderState {
  objects: IDBAuthor[]
}

export const CoreAuthorContext = createContext<CoreAuthorProviderState>({
  objects: []
})

const authorFields = [
  'document.title',
  'document.meta.core_author.data.firstName',
  'document.meta.core_author.data.lastName',
  'document.meta.core_author.data.initials',
  'document.meta.core_contact_info.data.email',
  'document.rel.same_as.uri'
]

export const CoreAuthorProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/author'
  const { index } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBAuthor[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !index || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBAuthor>(
      IDB,
      documentType,
      index,
      data.accessToken,
      force,
      authorFields,
      (hit) => {
        const { id, fields: f } = hit
        return {
          id,
          name: f['document.title']?.values?.[0]?.trim() ?? '',
          firstName: f['document.meta.core_author.data.firstName']?.values?.[0]?.trim() ?? '',
          lastName: f['document.meta.core_author.data.lastName']?.values?.[0]?.trim() ?? '',
          initials: f['document.meta.core_author.data.initials']?.values?.[0]?.trim() ?? '',
          email: f['document.meta.core_contact_info.data.email']?.values?.[0]?.trim() ?? '',
          sub: f['document.rel.same_as.uri']?.values
            ?.find((m: string) => m?.startsWith('core://user/sub'))?.trim() ?? ''
        }
      }
    )

    if (Array.isArray(cachedObjects) && cachedObjects.length) {
      setObjects(cachedObjects)
    }
  }, [data?.accessToken, index, IDB])


  /**
   * Get and refresh object store cache if necessary on first load
   */
  useEffect(() => {
    void getOrRefreshCache()
  }, [getOrRefreshCache])


  /**
   * Listen to events to know when something have happened.
   * Then just clear and refresh the object store cache.
   */
  useRepositoryEvents(documentType, () => {
    getOrRefreshCache(true).catch((ex) => {
      console.error(ex)
    })
  })

  return (
    <CoreAuthorContext.Provider value={{ objects }}>
      {children}
    </CoreAuthorContext.Provider>
  )
}
