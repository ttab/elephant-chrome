import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
const _fields = [
  'document.meta.core_author.data.firstName',
  'document.meta.core_author.data.lastName',
  'document.meta.core_author.data.initials',
  'document.meta.core_contact_info.data.email',
  'document.meta.core_contact_info.data.city',
  'document.meta.core_contact_info.data.country',
  'document.rel.same_as.uri'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for authors.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the authorSchema.
 */
export type AuthorFields = z.infer<typeof _schema>

/**
 * Interface extending HitV1 with a fields property of type AuthorFields
 */
export interface Author extends HitV1 {
  fields: AuthorFields
}

/**
 * Export fields and cast it as AuthorFields
 */
export const fields = _fields as unknown as AuthorFields
