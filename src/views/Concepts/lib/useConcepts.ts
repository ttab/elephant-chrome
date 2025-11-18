import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import type { ConceptTableDataKey } from './conceptDataTable'
import { tableDataMap } from './conceptDataTable'
import { useOrganisers } from '@/hooks/useOrganisers'

export const useConcepts = (title: ConceptTableDataKey | undefined) => {
  const sections = useSections({ activeOnly: false })
  const storyTags = useStories({ activeOnly: false })
  const organisers = useOrganisers({ activeOnly: false })
  /* const categories = useCategories({ activeOnly: false })
  const contentSources = useContentSources({ activeOnly: false })
  const editorialInfoTypes = useEditorialInfoTypes({ activeOnly: false })
  const wireSources = useWireSources({ activeOnly: false }) */

  const conceptMap = {
    'core/section': { ...tableDataMap['core/section'], data: sections },
    'core/story': { ...tableDataMap['core/story'], data: storyTags },
    'core/organiser': { ...tableDataMap['core/organiser'], data: organisers }/* ,
    Kategorier: { ...tableDataMap.Kategorier, data: categories },
    Organisatörer: { ...tableDataMap.Organisatörer, data: organisers },
    Källor: { ...tableDataMap.Källor, data: contentSources },
    'Redaktionella informationstyper': { ...tableDataMap['Redaktionella informationstyper'], data: editorialInfoTypes },
    Telegramkällor: { ...tableDataMap.Telegramkällor, data: wireSources } */
  }

  const concept = title ? conceptMap[title] : undefined

  return { concept }
}
