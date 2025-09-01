import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const _fields = [
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
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for factboxes.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the factboxesSchema.
 */
type FactboxFieldsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type FactboxFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type FactboxSchema.
 */
export interface Factbox extends HitV1 {
  fields: FactboxFieldsObject
}

/**
 * Export fields and cast it as FactboxFields
 */
export const fields = _fields as unknown as FactboxFields
