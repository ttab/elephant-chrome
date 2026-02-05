import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import type { ConceptTableDataKey } from './conceptDataTable'
import { tableDataMap } from './conceptDataTable'
import { useOrganisers } from '@/hooks/useOrganisers'

export const useConcepts = (title: ConceptTableDataKey | undefined) => {
  const sections = useSections({ sort: 'title', activeOnly: false })
  const storyTags = useStories({ sort: 'title', activeOnly: false })
  const organisers = useOrganisers({ activeOnly: false })

  const conceptMap = {
    'core/section': { ...tableDataMap['core/section'], data: sections },
    'core/story': { ...tableDataMap['core/story'], data: storyTags },
    'core/organiser': { ...tableDataMap['core/organiser'], data: organisers }
  }

  const concept = title ? conceptMap[title] : undefined

  return { concept }
}
