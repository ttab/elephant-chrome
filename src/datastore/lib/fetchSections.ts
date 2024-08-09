import { Sections } from '@/lib/index'
import { type IDBSection } from '../types'

/**
 * Fetch stories from index
 */
export async function fetchSections(indexUrl: URL, accessToken: string): Promise<IDBSection[]> {
  let page = 1
  let totalPages: number | undefined
  const sections: IDBSection[] = []

  try {
    do {
      const result = await Sections.get(
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
        sections.push({
          id,
          title: _['document.title'][0].trim()
        })
      })

      page++
      totalPages = result.pages
    } while (totalPages && page <= totalPages)
  } catch (ex) {
    console.warn(ex)
    return []
  }

  return sections
}
