import { Authors } from '@/lib/index'
import { type IDBAuthor } from '../types'

export async function fetchAuthors(indexUrl: URL, accessToken: string): Promise<IDBAuthor[]> {
  let page = 1
  let totalPages: number | undefined
  const authors: IDBAuthor[] = []

  try {
    do {
      const result = await Authors.get(
        new URL(indexUrl),
        accessToken,
        {
          page,
          size: 500
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
  } catch (ex) {
    console.warn(ex)
    return []
  }

  return authors
}
