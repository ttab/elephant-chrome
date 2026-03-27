import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBStory } from '../types'

interface CoreStoryProviderState {
  objects: IDBStory[]
}

export const CoreStoryContext = createContext<CoreStoryProviderState>({
  objects: []
})

const storyFields = [
  'document.title',
  'document.meta.core_definition.role',
  'document.meta.core_definition.data.text'
]

export const CoreStoryProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/story'
  const { index } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBStory[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !index || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBStory>(
      IDB,
      documentType,
      index,
      data.accessToken,
      force,
      storyFields,
      (hit) => {
        const { id, fields: f } = hit
        const roles = f['document.meta.core_definition.role']?.values ?? []
        const texts = f['document.meta.core_definition.data.text']?.values ?? []

        const story = {
          id,
          title: f['document.title']?.values?.[0]?.trim() ?? '',
          shortText: '',
          longText: ''
        }

        for (let i = 0; i < roles.length; i++) {
          const role = roles[i]?.trim()
          const text = texts[i]?.trim() ?? ''
          if (role === 'short') {
            story.shortText = text
          } else if (role === 'long') {
            story.longText = text
          }
        }

        return story
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
    <CoreStoryContext.Provider value={{ objects }}>
      {children}
    </CoreStoryContext.Provider>
  )
}
