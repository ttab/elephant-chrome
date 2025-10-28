import { createContext, useCallback, useEffect, useState } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBSection } from '../types'
import { type IndexedSection } from '@/lib/index'

interface CoreSectionProviderState {
  objects: IDBSection[]
}

export const CoreSectionContext = createContext<CoreSectionProviderState>({
  objects: []
})

export const CoreSectionProvider = ({ children, usableOnly = true }: {
  children: React.ReactNode
  usableOnly?: boolean
}): JSX.Element => {
  const documentType = 'core/section'
  const { server: { indexUrl }, repository } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBSection[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.isConnected) {
      return
    }

    const getCachedObjects = async () => {
      // Due to opensearches refresh_interval we need to wait 3 second before refetching
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const newDocs = await fetchOrRefresh<IDBSection, IndexedSection>(
        IDB,
        documentType,
        indexUrl,
        data.accessToken,
        force,
        (item) => {
          const { _id: id, _source: _ } = item
          return {
            id,
            title: _['document.title'][0].trim(),
            usableVersion: BigInt(_['heads.usable.version'][0])
          }
        }
      )

      if (!usableOnly) {
        return newDocs
      }

      const usableVersions = newDocs.map((item) => {
        return {
          uuid: item.id,
          version: item.usableVersion
        }
      })

      const usables = await repository?.getDocuments({
        documents: usableVersions,
        accessToken: data.accessToken
      })
      newDocs.forEach((document) => {
        if (!document.id) {
          return
        }
        const match = usables && usables.items.find((item) => item.document?.uuid === document.id)

        if (match) {
          document.title = match.document?.title ? match.document.title : ''
        }
      })
      return newDocs
    }

    const cachedObjects = await getCachedObjects()

    if (Array.isArray(cachedObjects) && cachedObjects.length) {
      setObjects(cachedObjects)
    }
  }, [data?.accessToken, indexUrl, IDB, usableOnly, repository])


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
    <CoreSectionContext.Provider value={{ objects }}>
      {children}
    </CoreSectionContext.Provider>
  )
}
