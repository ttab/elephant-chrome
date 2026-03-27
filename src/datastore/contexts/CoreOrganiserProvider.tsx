import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBOrganiser } from '../types'

interface CoreOrganiserProviderState {
  objects: IDBOrganiser[]
}

export const CoreOrganiserContext = createContext<CoreOrganiserProviderState>({
  objects: []
})

const organiserFields = [
  'document.title',
  'document.meta.core_contact_info.data.city',
  'document.meta.core_contact_info.data.country',
  'document.meta.core_contact_info.data.email',
  'document.meta.core_contact_info.data.phone',
  'document.meta.core_contact_info.data.streetAddress'
]

export const CoreOrganiserProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/organiser'
  const { index } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBOrganiser[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !index || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBOrganiser>(
      IDB,
      documentType,
      index,
      data.accessToken,
      force,
      organiserFields,
      (hit) => {
        const { id, fields: f } = hit
        return {
          id,
          title: f['document.title']?.values?.[0]?.trim() ?? '',
          city: f['document.meta.core_contact_info.data.city']?.values?.[0]?.trim() ?? '',
          country: f['document.meta.core_contact_info.data.country']?.values?.[0]?.trim() ?? '',
          email: f['document.meta.core_contact_info.data.email']?.values?.[0]?.trim() ?? '',
          phone: f['document.meta.core_contact_info.data.phone']?.values?.[0]?.trim() ?? '',
          streetAddress: f['document.meta.core_contact_info.data.streetAddress']?.values?.[0]?.trim() ?? ''
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
    <CoreOrganiserContext.Provider value={{ objects }}>
      {children}
    </CoreOrganiserContext.Provider>
  )
}
