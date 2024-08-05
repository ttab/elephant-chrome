import { createContext, useCallback, useEffect, useState } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { Authors } from '@/lib/index'
import { IDB } from '@/lib/indexedDB'

export interface IAuthor {
  id: string
  title: string
  firstName: string
  lastName: string
  initials: string
  email: string
}

interface AuthorsProviderState {
  authors: IAuthor[]
}

export const AuthorsContext = createContext<AuthorsProviderState>({
  authors: []
})

export const AuthorsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [authors, setAuthors] = useState<IAuthor[]>([])
  const storeName = 'core_authors'


  const openObjectStore = useCallback(async () => {
    return await IDB.open(storeName)
  }, [])


  /*
   * Get authors from cache, else from index and add to cache
   */
  const getOrRefreshCache = useCallback(async (): Promise<void> => {
    if (!data?.accessToken || !indexUrl) {
      return
    }
    const db = await openObjectStore()
    const readStore = db.transaction(storeName, 'readonly').objectStore(storeName)
    const cachedAuthors = await IDB.get(readStore)

    if (Array.isArray(cachedAuthors) && cachedAuthors.length) {
      setAuthors(cachedAuthors)
    } else {
      const authors: IAuthor[] = await fetchAuthorsFromIndex(indexUrl, data.accessToken)
      const updateStore = db.transaction(storeName, 'readwrite').objectStore(storeName)

      for (const author of authors) {
        await IDB.put(updateStore, author.id, author)
      }

      db.close()
      setAuthors(authors)
    }
  }, [data?.accessToken, indexUrl, openObjectStore])


  /*
   * Clear cache
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    const db = await openObjectStore()
    const updateStore = db.transaction(storeName, 'readwrite').objectStore(storeName)
    const isCleared = await IDB.clear(updateStore)
    db.close()

    return isCleared
  }, [openObjectStore])

  /**
   * Get and refresh cache if necessary on first load
   */
  useEffect(() => {
    void getOrRefreshCache()
  }, [getOrRefreshCache])


  /**
   * Listen to author events to know when something have happend.
   * Then just clear and refresh the cache.
   */
  useRepositoryEvents('core/author', () => {
    clearCache()
      .then(isCleared => {
        if (isCleared) {
          void getOrRefreshCache()
        } else {
          console.warn('Failed clearing cache, will not try to refresh it')
        }
      })
      .catch(ex => {
        console.warn(ex)
      })
  })

  return (
    <AuthorsContext.Provider value={{ authors }}>
      {children}
    </AuthorsContext.Provider >
  )
}


/**
 * Fetch authors from index
 */
async function fetchAuthorsFromIndex(indexUrl: URL, accessToken: string): Promise<IAuthor[]> {
  let page = 1
  let totalPages: number | undefined
  const authors: IAuthor[] = []

  do {
    const result = await Authors.get(
      new URL(indexUrl),
      accessToken,
      {
        page,
        size: 500,
        sort: {
          name: 'asc'
        }
      }
    )

    if (!Array.isArray(result.hits)) {
      break
    }

    result.hits.forEach(hit => {
      const { _id: id, _source: _ } = hit
      authors.push({
        id,
        title: _['document.title'][0].trim(),
        firstName: _?.['document.meta.core_author.data.firstName']?.[0].trim() || '',
        lastName: _?.['document.meta.core_author.data.lastName']?.[0].trim() || '',
        initials: _?.['document.meta.core_author.data.initials']?.[0].trim() || '',
        email: _?.['document.meta.core_contact_info.data.email']?.[0].trim() || ''
      })
    })

    page++
    totalPages = result.pages
  } while (totalPages && page <= totalPages)

  return authors
}
