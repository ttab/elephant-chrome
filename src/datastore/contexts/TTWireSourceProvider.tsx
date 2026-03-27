import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBWireSource } from '../types'

interface TTWireSourceProviderState {
  objects: IDBWireSource[]
}

export const TTWireSourceContext = createContext<TTWireSourceProviderState>({
  objects: []
})

export const TTWireSourceProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'tt/wire-source'
  const { index } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBWireSource[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !index || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBWireSource>(
      IDB,
      documentType,
      index,
      data.accessToken,
      force,
      ['document.title', 'document.uri'],
      (hit) => ({
        id: hit.id,
        uri: hit.fields['document.uri']?.values?.[0]?.trim() ?? '',
        title: hit.fields['document.title']?.values?.[0]?.trim() ?? ''
      })
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
    <TTWireSourceContext.Provider value={{ objects }}>
      {children}
    </TTWireSourceContext.Provider>
  )
}
