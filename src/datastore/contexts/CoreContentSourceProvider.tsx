import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBContentSource } from '../types'

export const { Context: CoreContentSourceContext, Provider: CoreContentSourceProvider }
  = createDatastoreProvider<IDBContentSource>({
    documentType: 'core/content-source',
    fields: ['document.title', 'document.uri'],
    transformer: (hit) => ({
      id: hit.id,
      uri: hit.fields['document.uri']?.values?.[0]?.trim() ?? '',
      title: hit.fields['document.title']?.values?.[0]?.trim() ?? ''
    })
  })
