import { createContext, useCallback, useEffect, useState } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { fetchStories } from '../lib/fetchStories'
import { type IDBStory } from '../types'

interface CoreStoryProviderState {
  objects: IDBStory[]
}

export const CoreStoryContext = createContext<CoreStoryProviderState>({
  objects: []
})

export const CoreStoryProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/story'
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBStory[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.db) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBStory>(
      IDB,
      documentType,
      force,
      async () => {
        return await fetchStories(indexUrl, data.accessToken)
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
    <CoreStoryContext.Provider value={{ objects }}>
      {children}
    </CoreStoryContext.Provider >
  )
}
