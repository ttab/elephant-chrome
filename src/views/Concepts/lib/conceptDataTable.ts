import type { IDBSection, IDBStory } from 'src/datastore/types'

export const tableDataMap = {
  Sektioner: {
    conceptTitle: 'Sektion',
    data: null as unknown as IDBSection[],
    conceptView: 'Section',
    documentType: 'core/section'
  },
  'Story tags': {
    conceptTitle: 'Story Tag',
    data: null as unknown as IDBStory[],
    conceptView: 'Story',
    documentType: 'core/story'
  }/* ,
    Kategorier: {
      conceptTitle: 'Kategori',
      data: null as unknown as IDBCategory,
      conceptView: 'Category'
      documentType: 'core/category'
      },
      Organisatörer: {
        conceptTitle: 'Organisatör',
        data: null as unknown as IDBOrganiser,
        conceptView: 'Organiser'
        documentType: 'core/organiser'
    } */
} as const

export type TableDataMap = typeof tableDataMap
export type TableDataKey = keyof TableDataMap
/* export type TableDataValue<K extends TableDataKey> = TableDataMap[K]
export type TableDataInnerKey<K extends TableDataKey> = keyof TableDataValue<K> */
