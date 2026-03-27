import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBCategory } from '../types'

export const { Context: CoreCategoryContext, Provider: CoreCategoryProvider }
  = createDatastoreProvider<IDBCategory>({
    documentType: 'core/category',
    fields: ['document.title'],
    transformer: (hit) => ({
      id: hit.id,
      title: hit.fields['document.title']?.values?.[0]?.trim() ?? ''
    })
  })
