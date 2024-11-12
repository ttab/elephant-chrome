import { createContext, useCallback, useEffect, useState } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBOrganiser } from '../types'
import { type IndexedOrganiser } from '@/lib/index'

interface CoreOrganiserProviderState {
  objects: IDBOrganiser[]
}

export const CoreOrganiserContext = createContext<CoreOrganiserProviderState>({
  objects: []
})

export const CoreOrganiserProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/organiser'
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBOrganiser[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.db) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBOrganiser, IndexedOrganiser>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        const { _id: id, _source: _ } = item
        return {
          id,
          title: _['document.title']?.[0].trim() || '',
          city: _['document.meta.core_contact_info.data.city']?.[0].trim() || '',
          country: _['document.meta.core_contact_info.data.country']?.[0].trim() || '',
          email: _['document.meta.core_contact_info.data.email']?.[0]?.trim() || '',
          phone: _['document.meta.core_contact_info.data.phone']?.[0]?.trim() || '',
          streetAddress: _['document.meta.core_contact_info.data.streetAddress']?.[0].trim() || ''
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
    <CoreOrganiserContext.Provider value={{ objects }}>
      {children}
    </CoreOrganiserContext.Provider>
  )
}
