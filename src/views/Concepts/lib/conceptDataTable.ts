import { TagIcon } from '@ttab/elephant-ui/icons'
import type { IDBOrganiser, IDBSection, IDBStory } from '../../../datastore/types.js'

export const tableDataMap = {
  'core/section': {
    label: 'Sektioner',
    conceptTitle: 'Sektion',
    description: 'En sektion för innehåll',
    data: null as unknown as IDBSection[],
    documentType: 'core/section',
    icon: TagIcon
  },
  'core/story': {
    label: 'Story tags',
    conceptTitle: 'Story Tag',
    description: 'En pågående historia som det rapporteras om',
    data: null as unknown as IDBStory[],
    documentType: 'core/story',
    icon: TagIcon
  },
  'core/organiser': {
    label: 'Organisatörer',
    conceptTitle: 'Organisatör',
    description: 'Ett dokument som beskriver en organisation',
    data: null as unknown as IDBOrganiser[],
    documentType: 'core/organiser',
    icon: TagIcon
  }
} as const


export type ConceptTableDataMap = typeof tableDataMap
export type ConceptTableDataKey = keyof ConceptTableDataMap

