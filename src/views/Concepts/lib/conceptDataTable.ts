import { TagIcon } from '@ttab/elephant-ui/icons'
import type { IDBOrganiser, IDBSection, IDBStory } from 'src/datastore/types'
import { SectionContent } from '../../Concept/components/SectionContent'
import { StoryTagContent } from '../../Concept/components/StoryTagContent'
import { OrganiserContent } from '@/views/Concept/components/OrganiserContent'

export const tableDataMap = {
  'core/section': {
    label: 'Sektioner',
    conceptTitle: 'Sektion',
    description: 'En sektion för innehåll',
    data: null as unknown as IDBSection[],
    documentType: 'core/section',
    icon: TagIcon,
    content: SectionContent
  },
  'core/story': {
    label: 'Story tags',
    conceptTitle: 'Story Tag',
    description: 'En pågående historia som det rapporteras om',
    data: null as unknown as IDBStory[],
    documentType: 'core/story',
    icon: TagIcon,
    content: StoryTagContent
  },
  'core/organiser': {
    label: 'Organisatörer',
    conceptTitle: 'Organisatör',
    description: 'Ett dokument som beskriver en organisation',
    data: null as unknown as IDBOrganiser[],
    documentType: 'core/organiser',
    icon: TagIcon,
    content: OrganiserContent
  }
} as const

export type ConceptTableDataMap = typeof tableDataMap
export type ConceptTableDataKey = keyof ConceptTableDataMap

