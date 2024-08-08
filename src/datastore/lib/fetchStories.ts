import { Stories } from '@/lib/index'
import { type IDBStory } from '../types'

/**
 * Fetch stories from index
 */
export async function fetchStories(indexUrl: URL, accessToken: string): Promise<IDBStory[]> {
  let page = 1
  let totalPages: number | undefined
  const stories: IDBStory[] = []

  try {
    do {
      const result = await Stories.get(
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

        stories.push(story)
      })

      page++
      totalPages = result.pages
    } while (totalPages && page <= totalPages)
  } catch (ex) {
    console.warn(ex)
    return []
  }

  return stories
}
