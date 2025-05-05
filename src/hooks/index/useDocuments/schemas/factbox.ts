import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const fields = [
  'modified',
  'document.title',
  'current_version',
  'created',
  'document.content.core_text.data.text',
  'document.language',
  'document.uri',
  'document.url',
  'text'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for factboxes.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the factboxesSchema.
 */
type FactboxFields = z.infer<typeof _schema>

/**
 * Interface extending HitV1 with a fields property of type FactboxSchema.
 */
export interface Factbox extends HitV1 {
  fields: FactboxFields
}
