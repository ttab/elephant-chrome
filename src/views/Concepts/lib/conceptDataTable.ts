import { TagIcon } from '@ttab/elephant-ui/icons'
import type { IDBSection, IDBStory } from 'src/datastore/types'
import { SectionContent } from '../../Concept/components/SectionContent'
import { StoryTagContent } from '../../Concept/components/StoryTagContent'

export const tableDataMap = {
  'core/section': {
    label: 'Sektioner',
    conceptTitle: 'Sektion',
    description: 'A section for content',
    data: null as unknown as IDBSection[],
    /* conceptView: 'Section', */
    documentType: 'core/section',
    icon: TagIcon,
    content: SectionContent
  },
  'core/story': {
    label: 'Story tags',
    conceptTitle: 'Story Tag',
    description: 'An ongoing story that gets reported on',
    data: null as unknown as IDBStory[],
    /* conceptView: 'Story', */
    documentType: 'core/story',
    icon: TagIcon,
    content: StoryTagContent
  }/* ,
  Kategorier: {
    label: 'Kategorier',
    conceptTitle: 'Kategori',
    description: 'A category for content',
    data: null as unknown as IDBCategory,
    conceptView: 'Category',
    documentType: 'core/category',
    icon: TagIcon
  },
  Organisatörer: {
  label: 'Organisatörer',
    conceptTitle: 'Organisatör',
    description: 'A document describing an organisation',
    data: null as unknown as IDBOrganiser,
    conceptView: 'Organiser',
    documentType: 'core/organiser',
    icon: TagIcon
  },
  Källor: {
    label: 'Källor',
    conceptTitle: 'Källa',
    description: 'The entity that is the source of the content, e.g. the organisation that produced it.',
    data: null as unknown as IDBContentSource,
    conceptView: 'ContentSource',
    documentType: 'core/content-source',
    icon: TagIcon
  },
  'Redaktionella informationstyper': {
    label: 'Redaktionella informationstyper
    conceptTitle: 'Redaktionell informationstyp',
    data: null as unknown as IDBEditorialInfoType,
    conceptView: 'EditorialInfoType',
    documentType: 'tt/editorial-info-type',
    icon: TagIcon
  },
  Telegramkällor: {
    label: 'Telegramkällor',
    conceptTitle: 'Telegramkälla',
    description: '',
    data: null as unknown as IDBWireSource,
    conceptView: 'WireSource',
    documentType: 'tt/wire-source',
    icon: TagIcon
  } */
} as const

/* interface conceptsItem {
  label: string
  conceptTitle: string
  description: string
  data: object[]
  conceptView: string
  documentType: string
  icon: LucideIcon
}
 */
export type ConceptTableDataMap = typeof tableDataMap
export type ConceptTableDataKey = keyof ConceptTableDataMap
/* export type TableDataValue<K extends TableDataKey> = TableDataMap[K] */
/* export type TableDataInnerKey<K extends TableDataKey> = keyof TableDataValue<K> */