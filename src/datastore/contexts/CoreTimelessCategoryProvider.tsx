import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBTimelessCategory } from '../types'
import { type IndexedTimelessCategory } from '@/lib/index'

interface CoreTimelessCategoryProviderState {
  objects: IDBTimelessCategory[]
}

export const CoreTimelessCategoryContext = createContext<CoreTimelessCategoryProviderState>({
  objects: []
})

export const CoreTimelessCategoryProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/timeless-category'
  const indexUrl = useRegistry().server.resolveServiceUrl('index')
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBTimelessCategory[]>([])
  const IDB = useIndexedDB()

  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBTimelessCategory, IndexedTimelessCategory>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        const { _id: id, _source: _ } = item
        return {
          id,
          title: _['document.title'][0].trim()
        }
      }
    )

    if (Array.isArray(cachedObjects) && cachedObjects.length) {
      setObjects(cachedObjects)
    }
  }, [data?.accessToken, indexUrl, IDB])

  useEffect(() => {
    void getOrRefreshCache()
  }, [getOrRefreshCache])

  useRepositoryEvents(documentType, () => {
    getOrRefreshCache(true).catch((ex) => {
      console.error(ex)
    })
  })

  return (
    <CoreTimelessCategoryContext.Provider value={{ objects }}>
      {children}
    </CoreTimelessCategoryContext.Provider>
  )
}
