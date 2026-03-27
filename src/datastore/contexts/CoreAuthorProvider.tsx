import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBAuthor } from '../types'

export const { Context: CoreAuthorContext, Provider: CoreAuthorProvider }
  = createDatastoreProvider<IDBAuthor>({
    documentType: 'core/author',
    fields: [
      'document.title',
      'document.meta.core_author.data.firstName',
      'document.meta.core_author.data.lastName',
      'document.meta.core_author.data.initials',
      'document.meta.core_contact_info.data.email',
      'document.rel.same_as.uri'
    ],
    transformer: (hit) => {
      const { id, fields: f } = hit
      return {
        id,
        name: f['document.title']?.values?.[0]?.trim() ?? '',
        firstName: f['document.meta.core_author.data.firstName']?.values?.[0]?.trim() ?? '',
        lastName: f['document.meta.core_author.data.lastName']?.values?.[0]?.trim() ?? '',
        initials: f['document.meta.core_author.data.initials']?.values?.[0]?.trim() ?? '',
        email: f['document.meta.core_contact_info.data.email']?.values?.[0]?.trim() ?? '',
        sub: f['document.rel.same_as.uri']?.values
          ?.find((m: string) => m?.startsWith('core://user/sub'))?.trim() ?? ''
      }
    }
  })
