import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBOrganiser } from '../types'

export const { Context: CoreOrganiserContext, Provider: CoreOrganiserProvider }
  = createDatastoreProvider<IDBOrganiser>({
    documentType: 'core/organiser',
    fields: [
      'document.title',
      'document.meta.core_contact_info.data.city',
      'document.meta.core_contact_info.data.country',
      'document.meta.core_contact_info.data.email',
      'document.meta.core_contact_info.data.phone',
      'document.meta.core_contact_info.data.streetAddress'
    ],
    transformer: (hit) => {
      const { id, fields: f } = hit
      return {
        id,
        title: f['document.title']?.values?.[0]?.trim() ?? '',
        city: f['document.meta.core_contact_info.data.city']?.values?.[0]?.trim() ?? '',
        country: f['document.meta.core_contact_info.data.country']?.values?.[0]?.trim() ?? '',
        email: f['document.meta.core_contact_info.data.email']?.values?.[0]?.trim() ?? '',
        phone: f['document.meta.core_contact_info.data.phone']?.values?.[0]?.trim() ?? '',
        streetAddress: f['document.meta.core_contact_info.data.streetAddress']?.values?.[0]?.trim() ?? ''
      }
    }
  })
