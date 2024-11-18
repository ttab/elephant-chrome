import { createContext, useCallback, useEffect, useState } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBStory } from '../types'
import { type IndexedStory } from '@/lib/index'

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

    const cachedObjects = await fetchOrRefresh<IDBStory, IndexedStory>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        const { _id: id, _source: _ } = item
        const getRoleText = (roleIndex: number): [string, string] => ([
          _['document.meta.core_definition.role']?.[roleIndex]?.trim() || '',
          _['document.meta.core_definition.data.text']?.[roleIndex]?.trim() || ''
        ])
        const [role0, text0] = getRoleText(0)
        const [role1, text1] = getRoleText(1)

        const story = {
          id,
          title: _['document.title'][0].trim(),
          shortText: '',
          longText: ''
        }

        if (role0 && text0) {
          if (role0 === 'short') {
            story.shortText = text0
          } else if (role0 === 'long') {
            story.longText = text0
          }
        }

        if (role1 && text1) {
          if (role1 === 'short') {
            story.shortText = text1
          } else if (role1 === 'long') {
            story.longText = text1
          }
        }

        return story
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
    <CoreStoryContext.Provider value={{ objects }}>
      {children}
    </CoreStoryContext.Provider>
  )
}
