import { useEffect, useState } from 'react'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { useAuthors } from './useAuthors'
import { useSession } from 'next-auth/react'
import { type IDBAuthor } from 'src/datastore/types'

const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Find and return author information based on logged-in user.
 *
 * Returns undefined while loading, null if not found.
 */
export const useActiveAuthor = ({ full = false }: {
  full?: boolean
} = {}): Document | IDBAuthor | null | undefined => {
  const session = useSession()
  const authors = useAuthors()
  const [author, setAuthor] = useState<Document | IDBAuthor | null | undefined>(undefined)

  useEffect(() => {
    const fetchData = async (authorId: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/api/documents/${authorId}`)
      if (!response.ok) {
        setAuthor(null)
        return
      }

      setAuthor((await response.json() as Record<string, unknown>)?.document as Document || null)
    }

    const author = authors.find(a => a.email === session.data?.user.email)
    if (!author) {
      setAuthor(null)
      return
    }

    if (full) {
      void fetchData(author.id)
    } else {
      setAuthor(author)
    }
  }, [authors, full, session?.data?.user.email])

  return author
}
