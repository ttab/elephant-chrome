import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBEditorialInfoType } from '../types'

export const { Context: TTEditorialInfoTypeContext, Provider: TTEditorialInfoTypeProvider }
  = createDatastoreProvider<IDBEditorialInfoType>({
    documentType: 'tt/editorial-info-type',
    fields: ['document.title'],
    transformer: (hit) => ({
      id: hit.id,
      title: hit.fields['document.title']?.values?.[0]?.trim() ?? ''
    })
  })
