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
]

/**
 * Create a schema based on fields array.
 */
const schemaShape = fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<string, z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for factboxes.
 */
export const schema = z.object(schemaShape)

/**
 * Type inferred from the factboxesSchema.
 */
export type FactboxFields = z.infer<typeof schema>

/**
 * Interface extending HitV1 with a fields property of type WireSchema.
 */
export interface Factbox extends HitV1 {
  fields: FactboxFields
}
