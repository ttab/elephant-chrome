import { useEffect, useState } from 'react'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { useAuthors } from './useAuthors'
import { useSession } from 'next-auth/react'
import { type IDBAuthor } from 'src/datastore/types'

const BASE_URL = import.meta.env.BASE_URL || ''

type UseActiveAuthorReturnType<T extends boolean | undefined> = T extends true ? Document | null | undefined : IDBAuthor | null | undefined

/**
 * Find and return author information based on logged-in user.
 *
 * Returns undefined while loading, null if not found.
 */
export const useActiveAuthor = <T extends boolean | undefined>({ full = false as T }: {
  full?: T
} = {}): UseActiveAuthorReturnType<T> => {
  const session = useSession()
  const authors = useAuthors()
  const [author, setAuthor] = useState<UseActiveAuthorReturnType<T>>(undefined)

  useEffect(() => {
    const fetchData = async (authorId: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/api/documents/${authorId}`)
      if (!response.ok) {
        setAuthor(undefined)
        return
      }

      setAuthor((await response.json() as Record<string, unknown>)?.document as UseActiveAuthorReturnType<T>)
    }

    const author = authors.find((a) => a.email === session.data?.user.email)
    if (!author) {
      setAuthor(undefined)
      return
    }

    if (full) {
      void fetchData(author.id)
    } else {
      setAuthor(author as UseActiveAuthorReturnType<T>)
    }
  }, [authors, full, session?.data?.user.email])

  return author
}
