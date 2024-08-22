import { createContext, useCallback, useEffect, useState } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBOrganisation } from '../types'
import { type IndexedOrganisation } from '@/lib/index'

interface CoreOrganisationProviderState {
  objects: IDBOrganisation[]
}

export const CoreOrganisationContext = createContext<CoreOrganisationProviderState>({
  objects: []
})

export const CoreOrganisationProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/organisation'
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBOrganisation[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.db) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBOrganisation, IndexedOrganisation>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        const { _id: id, _source: _ } = item
        return {
          id,
          title: _['document.title'],
          city: _['document.city'],
          country: _['document.country'],
          email: _['document.email'],
          phone: _['document.phone'],
          streetAddress: _['document.streetAddress']
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
    getOrRefreshCache(true).catch(ex => {
      console.error(ex)
    })
  })

  return (
    <CoreOrganisationContext.Provider value={{ objects }}>
      {children}
    </CoreOrganisationContext.Provider >
  )
}
