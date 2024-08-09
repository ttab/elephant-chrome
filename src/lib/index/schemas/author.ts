import { z } from 'zod'
import { BaseSchema } from './base'

const AuthorSchema = z.object({
  _source: z.object({
    'document.meta.core_author.data.firstName': z.array(z.string()),
    'document.meta.core_author.data.lastName': z.array(z.string()),
    'document.meta.core_author.data.initials': z.array(z.string()),
    'document.meta.core_contact_info.data.email': z.array(z.string()),
    'document.meta.core_contact_info.data.city': z.array(z.string()),
    'document.meta.core_contact_info.data.country': z.array(z.string())
  })
})

const FullAuthorSchema = BaseSchema.and(AuthorSchema)
export type IndexedAuthor = z.infer<typeof FullAuthorSchema>
