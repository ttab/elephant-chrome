import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBContentSource } from '../types'
import { type IndexedContentSource } from '@/lib/index'

interface CoreContentSourceProviderState {
  objects: IDBContentSource[]
}

export const CoreContentSourceContext = createContext<CoreContentSourceProviderState>({
  objects: []
})

export const CoreContentSourceProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/content-source'
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBContentSource[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBContentSource, IndexedContentSource>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        const { _id: id, _source: _ } = item
        return {
          id,
          uri: _['document.uri'][0].trim(),
          title: _['document.title'][0].trim(),
          usableVersion: BigInt(_['heads.usable.version'][0]),
          documentType: documentType
        }
      }
    )

    if (Array.isArray(cachedObjects) && cachedObjects.length) {
      setObjects(cachedObjects)
    }
  }, [data?.accessToken, indexUrl, IDB])


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
    <CoreContentSourceContext.Provider value={{ objects }}>
      {children}
    </CoreContentSourceContext.Provider>
  )
}
