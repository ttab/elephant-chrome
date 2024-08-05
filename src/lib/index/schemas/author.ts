import { z } from 'zod'

const AuthorSchema = z.object({
  _index: z.string(),
  _id: z.string(),
  _score: z.nullable(z.number()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.title': z.array(z.string()),
    'document.type': z.array(z.string()),
    'document.uri': z.array(z.string()),
    'document.url': z.array(z.string()),
    'heads.usable.created': z.array(z.string()),
    'heads.usable.creator': z.array(z.string()),
    'heads.usable.id': z.array(z.string()),
    'heads.usable.version': z.array(z.string()),
    'document.meta.core_author.data.firstName': z.array(z.string()),
    'document.meta.core_author.data.lastName': z.array(z.string()),
    'document.meta.core_author.data.initials': z.array(z.string()),
    'document.meta.core_contact_info.data.email': z.array(z.string()),
    'document.meta.core_contact_info.data.city': z.array(z.string()),
    'document.meta.core_contact_info.data.country': z.array(z.string()),
    modified: z.array(z.string()),
    readers: z.array(z.string()),
    text: z.null()
  })
})

export type Author = z.infer<typeof AuthorSchema>
