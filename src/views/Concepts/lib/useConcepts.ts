import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import type { TableDataKey } from './conceptDataTable'
import { tableDataMap } from './conceptDataTable'


export const useConcepts = (title: TableDataKey | undefined) => {
  const sections = useSections({ activeOnly: false })
  const storyTags = useStories({ activeOnly: false })
  /* const categories = useCategories()
  const organisers = useOrganisers() */
  const conceptMap = {
    Sektioner: { ...tableDataMap.Sektioner, data: sections },
    'Story tags': { ...tableDataMap['Story tags'], data: storyTags }
  }

  const concept = title ? conceptMap[title] : undefined

  return { type: concept?.conceptView, data: concept?.data }
}
