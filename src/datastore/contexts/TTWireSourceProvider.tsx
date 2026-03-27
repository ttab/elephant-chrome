import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBWireSource } from '../types'

export const { Context: TTWireSourceContext, Provider: TTWireSourceProvider }
  = createDatastoreProvider<IDBWireSource>({
    documentType: 'tt/wire-source',
    fields: ['document.title', 'document.uri'],
    transformer: (hit) => ({
      id: hit.id,
      uri: hit.fields['document.uri']?.values?.[0]?.trim() ?? '',
      title: hit.fields['document.title']?.values?.[0]?.trim() ?? ''
    })
  })
