import { createContext, useEffect, useState } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { Authors } from '@/lib/index/authors'
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

export const AuthorsProviderContext = createContext<AuthorsProviderState>({
  authors: []
})

export const AuthorsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [authors, setAuthors] = useState<IAuthor[]>([])

  useEffect(() => {
    async function fetchAuthors(): Promise<void> {
      if (!data?.accessToken || !indexUrl) {
        return
      }

      const storeName = 'core_authors'
      const db = await IDB.openDatabase(storeName)
      const cachedAuthors = await IDB.get(db, storeName)

      if (Array.isArray(cachedAuthors) && cachedAuthors.length) {
        console.debug('Loading authors from cache')
        setAuthors(cachedAuthors as IAuthor[])
        return
      }

      console.debug('Loading authors from index')

      let page = 1
      let totalPages: number | undefined
      const authors: IAuthor[] = []

      do {
        const result = await Authors.get(
          new URL(indexUrl),
          data.accessToken,
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

      authors.forEach(_ => {
        IDB.put(db, storeName, _.id, _)
      })

      setAuthors(authors)
    }

    void fetchAuthors()
  }, [indexUrl, data?.accessToken])

  return (
    <AuthorsProviderContext.Provider value={{ authors }}>
      {children}
    </AuthorsProviderContext.Provider>
  )
}
