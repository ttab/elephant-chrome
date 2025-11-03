import { useCategories } from '@/hooks/useCategories'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import type { ViewType } from '@/types/index'


export const useConcepts = (title: string | undefined) => {
  const sections = useSections()
  const storyTags = useStories()
  const categories = useCategories()
  const organisers = useOrganisers()

  const tableDataMap = {
    Sektioner: {
      conceptTitle: 'Sektion',
      data: sections,
      conceptView: 'Section'
    },
    'Story tags': {
      conceptTitle: 'Story Tag',
      data: storyTags,
      conceptView: 'StoryTag'
    },
    Kategorier: {
      conceptTitle: 'Kategori',
      data: categories,
      conceptView: 'Category'
    },
    Organisatörer: {
      conceptTitle: 'Organisatör',
      data: organisers,
      conceptView: 'Organiser'
    }
  } as const

  const getData = () => {
    if (!title || !(title in tableDataMap)) {
      return undefined
    }
    const data = tableDataMap[title as keyof typeof tableDataMap]
    return data.data
  }

  const getType = () => {
    if (!title || !(title in tableDataMap)) {
      return undefined
    }
    const data = tableDataMap[title as keyof typeof tableDataMap]
    return data.conceptView as ViewType
  }

  return { getType, getData }
}
