import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBSection } from '../types'

export const { Context: CoreSectionContext, Provider: CoreSectionProvider }
  = createDatastoreProvider<IDBSection>({
    documentType: 'core/section',
    fields: ['document.title'],
    transformer: (hit) => ({
      id: hit.id,
      title: hit.fields['document.title']?.values?.[0]?.trim() ?? ''
    })
  })
